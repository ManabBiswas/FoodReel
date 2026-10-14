/**
 * DB-backed integration tests.
 *
 * Every other suite in this repo runs without a database, which left the
 * highest-risk logic verified only by reasoning:
 *
 *  - the two $expr capacity/oversell guards (zone capacity, tier quantity),
 *    which mongoose's sanitizeFilter would silently reject
 *  - the atomic cart line mutations ($inc / positional $set / $pull)
 *  - the cross-restaurant cart guard
 *  - identity-scoped order queries (BOLA resistance)
 *  - the idempotency unique key under real contention
 *  - that strictQuery does not strip the paths the filters rely on
 *
 * Runs against a real mongod via MongoMemoryServer (replica set, so the
 * transaction-gated write paths are exercised too). Availability is settled at
 * module scope because a test's skip option is resolved when the file is
 * collected - inside a before() hook every test would skip even on a machine
 * that has a working database. If the binary cannot start, the file skips
 * cleanly so an offline CI run stays green.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

// Mirror production wiring before any model is compiled.
const mongoose = (await import('mongoose')).default;
mongoose.set('strictQuery', true);

let mongoServer;
let connected = false;
let unavailableReason = 'database not started';

try {
    const { MongoMemoryReplSet } = await import('mongodb-memory-server');
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongoServer.getUri(), { dbName: 'foodreel_test' });
    connected = true;
} catch (error) {
    unavailableReason = `database unavailable (${error.message})`;
    console.error(`[db.integration] skipping: ${unavailableReason}`);
}

after(async () => {
    if (connected) {
        await mongoose.connection.dropDatabase().catch(() => {});
        await mongoose.disconnect().catch(() => {});
    }
    if (mongoServer) await mongoServer.stop().catch(() => {});
});

const needsDb = { skip: connected ? false : unavailableReason };

// mongoose.model() throws if a name is compiled twice, so every helper
// memoises its models.
const model = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);
const oid = () => new mongoose.Types.ObjectId();

const eventModel = () =>
    model(
        'FestEvent',
        new mongoose.Schema({
            name: String,
            venue: { address: String, city: String },
            startTime: Date,
            endTime: Date,
            salesStart: Date,
            salesEnd: Date,
            organizer: String,
            status: { type: String, default: 'draft' }
        })
    );

const zoneModel = () =>
    model(
        'FestZone',
        new mongoose.Schema({
            eventId: { type: mongoose.Schema.Types.ObjectId, required: true },
            name: { type: String, required: true },
            capacity: { type: Number, required: true },
            currentCount: { type: Number, default: 0 },
            totalAdmitted: { type: Number, default: 0 },
            tracksExit: { type: Boolean, default: false }
        })
    );

const tierModel = (name = 'FestTier') =>
    model(
        name,
        new mongoose.Schema({
            eventId: { type: mongoose.Schema.Types.ObjectId, required: true },
            name: String,
            price: { type: Number, required: true },
            quantity: { type: Number, required: true },
            sold: { type: Number, default: 0 },
            reserved: { type: Number, default: 0 },
            active: { type: Boolean, default: true }
        })
    );

const cartModels = () => ({
    Partner: model(
        'CartPartner',
        new mongoose.Schema({ companyName: String })
    ),
    Food: model(
        'CartFood',
        new mongoose.Schema({
            name: String,
            price: Number,
            postType: { type: String, default: 'food' },
            isActive: { type: Boolean, default: true },
            isAvailable: { type: Boolean, default: true },
            foodPartner: { type: mongoose.Schema.Types.ObjectId }
        })
    ),
    Cart: model(
        'CartDoc',
        new mongoose.Schema({
            user: { type: mongoose.Schema.Types.ObjectId, required: true },
            items: [
                {
                    foodItem: { type: mongoose.Schema.Types.ObjectId, ref: 'CartFood', required: true },
                    quantity: { type: Number, required: true, min: 1 },
                    priceAtAdd: { type: Number, required: true },
                    foodPartner: { type: mongoose.Schema.Types.ObjectId, required: true },
                    specialInstructions: { type: String, maxLength: 200 },
                    addedAt: { type: Date, default: Date.now }
                }
            ],
            activeRestaurant: { type: mongoose.Schema.Types.ObjectId }
        })
    )
});

const seedEvent = async (Event) =>
    Event.create({
        name: 'Fest',
        venue: { address: '1 Road', city: 'Pune' },
        startTime: new Date(),
        endTime: new Date(Date.now() + 864e5),
        salesStart: new Date(),
        salesEnd: new Date(Date.now() + 864e5),
        organizer: 'Org',
        status: 'live'
    });

// ---------- $expr capacity guards (the sanitizeFilter trap) ----------

test('zone capacity $expr guard admits until full, then refuses', needsDb, async () => {
    const Event = eventModel();
    const Zone = zoneModel();
    const event = await seedEvent(Event);
    const zone = await Zone.create({
        eventId: event._id,
        name: 'Gate A',
        capacity: 2,
        currentCount: 0
    });

    // Exactly the query scan.gate.controller uses to admit someone.
    const admit = () =>
        Zone.findOneAndUpdate(
            {
                _id: zone._id,
                eventId: event._id,
                $expr: { $lt: ['$currentCount', '$capacity'] }
            },
            { $inc: { currentCount: 1, totalAdmitted: 1 } },
            { new: true }
        );

    assert.ok(await admit(), 'first admission must succeed');
    assert.ok(await admit(), 'second admission must succeed');
    assert.equal(await admit(), null, 'capacity must be enforced by the $expr guard');

    const stored = await Zone.findById(zone._id);
    assert.equal(stored.currentCount, 2, 'count must never exceed capacity');
    assert.equal(stored.totalAdmitted, 2);
});

test('ticket tier $expr guard prevents oversell', needsDb, async () => {
    const Tier = tierModel();
    const eventId = oid();
    const tier = await Tier.create({
        eventId,
        name: 'Early',
        price: 100,
        quantity: 2,
        sold: 1,
        reserved: 0
    });

    const claim = () =>
        Tier.findOneAndUpdate(
            {
                _id: tier._id,
                eventId,
                $expr: { $lt: [{ $add: ['$sold', '$reserved'] }, '$quantity'] }
            },
            { $inc: { sold: 1 } },
            { new: true }
        );

    assert.ok(await claim(), 'one ticket remains, so this sale must go through');
    assert.equal(await claim(), null, 'the last ticket must not be oversold');

    const stored = await Tier.findById(tier._id);
    assert.equal(stored.sold, 2, 'sold can never exceed quantity');
});

test('concurrent ticket claims never oversell', needsDb, async () => {
    const Tier = tierModel('ContendedTier');
    const eventId = oid();
    const tier = await Tier.create({ eventId, price: 10, quantity: 5, sold: 0 });

    const claim = () =>
        Tier.findOneAndUpdate(
            {
                _id: tier._id,
                eventId,
                $expr: { $lt: [{ $add: ['$sold', '$reserved'] }, '$quantity'] }
            },
            { $inc: { sold: 1 } },
            { new: true }
        );

    const admitted = (await Promise.all(Array.from({ length: 20 }, claim))).filter(Boolean);
    assert.equal(admitted.length, 5, 'exactly `quantity` claims may succeed under contention');

    const stored = await Tier.findById(tier._id);
    assert.equal(stored.sold, 5, 'sold must equal quantity exactly, never more');
});

// ---------- strictQuery must not strip the paths filters depend on ----------

test('strictQuery keeps identity-scoped filter paths', needsDb, async () => {
    const User = model(
        'StrictProbe',
        new mongoose.Schema({ email: String, role: String })
    );
    await User.create([
        { email: 'a@x.com', role: 'user' },
        { email: 'b@x.com', role: 'partner' }
    ]);

    // 'role' is in the schema, so strictQuery must keep filtering on it.
    assert.equal((await User.find({ role: 'user' }).lean()).length, 1);

    // An unknown path is dropped rather than forwarded to the driver.
    assert.equal((await User.find({ nope: 'x' }).lean()).length, 2);
});

// ---------- idempotency unique key ----------

const keyModel = (name) =>
    model(
        name,
        new mongoose.Schema(
            {
                scope: { type: String, required: true },
                key: { type: String, required: true },
                user: { type: mongoose.Schema.Types.ObjectId, required: true }
            },
            { timestamps: true }
        )
    );

test('idempotency key admits one claim per (scope,key,user)', needsDb, async () => {
    const Key = keyModel('IdemKey');
    await Key.collection.createIndex({ scope: 1, key: 1, user: 1 }, { unique: true });

    const scope = 'order.create';
    const key = 'abc-123';
    const user = oid();

    await Key.create({ scope, key, user });

    let duplicateRejected = false;
    try {
        await Key.create({ scope, key, user });
    } catch (error) {
        duplicateRejected = error.code === 11000;
    }
    assert.equal(duplicateRejected, true, 'the unique index must reject a replayed key');

    // Keys are scoped per user, so another user is unaffected.
    await Key.create({ scope, key, user: oid() });
    assert.equal(await Key.countDocuments({ scope, key }), 2);
});

test('concurrent identical claims yield exactly one winner', needsDb, async () => {
    const Key = keyModel('IdemKeyRace');
    await Key.collection.createIndex({ scope: 1, key: 1, user: 1 }, { unique: true });

    const doc = { scope: 'order.create', key: 'race', user: oid() };
    const attempts = await Promise.allSettled(Array.from({ length: 5 }, () => Key.create(doc)));
    const winners = attempts.filter((a) => a.status === 'fulfilled');

    assert.equal(winners.length, 1, 'a read-then-write race would let more than one through');
});

// ---------- cart atomic line mutations ----------

test('positional $inc increments an existing cart line without duplicating it', needsDb, async () => {
    const { Partner, Food, Cart } = cartModels();
    const partner = await Partner.create({ companyName: 'Tandoor' });
    const food = await Food.create({ name: 'Paneer', price: 150, foodPartner: partner._id });
    const user = oid();
    await Cart.create({
        user,
        activeRestaurant: partner._id,
        items: [{ foodItem: food._id, quantity: 1, priceAtAdd: 150, foodPartner: partner._id }]
    });

    const updated = await Cart.findOneAndUpdate(
        { user, 'items.foodItem': food._id },
        { $inc: { 'items.$.quantity': 2 }, $set: { 'items.$.priceAtAdd': food.price } },
        { new: true }
    );

    assert.equal(updated.items.length, 1, 'an existing line must be updated, not appended');
    assert.equal(updated.items[0].quantity, 3);
});

test('concurrent adds of the same item do not create duplicate lines', needsDb, async () => {
    const { Partner, Food, Cart } = cartModels();
    const partner = await Partner.create({ companyName: 'Wok' });
    const food = await Food.create({ name: 'Noodles', price: 99, foodPartner: partner._id });
    const user = oid();
    await Cart.create({ user, activeRestaurant: partner._id, items: [] });

    const push = () =>
        Cart.findOneAndUpdate(
            {
                user,
                'items.foodItem': { $ne: food._id },
                $or: [{ activeRestaurant: null }, { activeRestaurant: partner._id }]
            },
            {
                $push: {
                    items: {
                        foodItem: food._id,
                        quantity: 1,
                        priceAtAdd: food.price,
                        foodPartner: partner._id
                    }
                }
            },
            { new: true }
        );

    await Promise.all([push(), push(), push()]);
    const stored = await Cart.findOne({ user });
    assert.equal(stored.items.length, 1, 'the $ne guard must collapse concurrent pushes into one line');
});

test('the restaurant guard refuses a push for a different vendor', needsDb, async () => {
    const { Partner, Food, Cart } = cartModels();
    const kitchenA = await Partner.create({ companyName: 'A' });
    const kitchenB = await Partner.create({ companyName: 'B' });
    const foodA = await Food.create({ name: 'A1', price: 10, foodPartner: kitchenA._id });
    const foodB = await Food.create({ name: 'B1', price: 20, foodPartner: kitchenB._id });
    const user = oid();
    await Cart.create({
        user,
        activeRestaurant: kitchenA._id,
        items: [{ foodItem: foodA._id, quantity: 1, priceAtAdd: 10, foodPartner: kitchenA._id }]
    });

    const result = await Cart.findOneAndUpdate(
        {
            user,
            'items.foodItem': { $ne: foodB._id },
            $or: [{ activeRestaurant: null }, { activeRestaurant: kitchenB._id }]
        },
        {
            $push: {
                items: {
                    foodItem: foodB._id,
                    quantity: 1,
                    priceAtAdd: 20,
                    foodPartner: kitchenB._id
                }
            }
        },
        { new: true }
    );

    assert.equal(result, null, 'a second vendor must not be added once the cart is claimed');
    assert.equal((await Cart.findOne({ user })).items.length, 1);
});

test('$pull removes a line and leaves the rest intact', needsDb, async () => {
    const { Partner, Food, Cart } = cartModels();
    const partner = await Partner.create({ companyName: 'Cafe' });
    const f1 = await Food.create({ name: 'One', price: 5, foodPartner: partner._id });
    const f2 = await Food.create({ name: 'Two', price: 6, foodPartner: partner._id });
    const user = oid();
    const cart = await Cart.create({
        user,
        activeRestaurant: partner._id,
        items: [
            { foodItem: f1._id, quantity: 1, priceAtAdd: 5, foodPartner: partner._id },
            { foodItem: f2._id, quantity: 2, priceAtAdd: 6, foodPartner: partner._id }
        ]
    });

    const after = await Cart.findOneAndUpdate(
        { user, 'items._id': cart.items[0]._id },
        { $pull: { items: { _id: cart.items[0]._id } } },
        { new: true }
    );

    assert.equal(after.items.length, 1);
    assert.equal(after.items[0].foodItem.toString(), f2._id.toString());
});

test('a deleted food item populates as null so the cart can prune it', needsDb, async () => {
    const { Partner, Food, Cart } = cartModels();
    const partner = await Partner.create({ companyName: 'Ghost' });
    const food = await Food.create({ name: 'Doomed', price: 7, foodPartner: partner._id });
    const user = oid();
    await Cart.create({
        user,
        activeRestaurant: partner._id,
        items: [{ foodItem: food._id, quantity: 1, priceAtAdd: 7, foodPartner: partner._id }]
    });

    await Food.deleteOne({ _id: food._id });

    const populated = await Cart.findOne({ user }).populate('items.foodItem');
    assert.equal(populated.items[0].foodItem, null, 'a deleted line must surface as null, not throw');

    // pruneDeletedItems (cart.controller) keys off exactly that null.
    const before = populated.items.length;
    populated.items = populated.items.filter((i) => i.foodItem);
    assert.equal(populated.items.length, before - 1);
});

// ---------- BOLA resistance on orders ----------

test('partner order queries only match orders containing that partner', needsDb, async () => {
    const Order = model(
        'OrderBola',
        new mongoose.Schema({
            user: { type: mongoose.Schema.Types.ObjectId, required: true },
            status: { type: String, default: 'pending' },
            items: [
                {
                    foodItem: { type: mongoose.Schema.Types.ObjectId },
                    quantity: Number,
                    priceAtOrder: Number,
                    foodPartner: { type: mongoose.Schema.Types.ObjectId, required: true }
                }
            ]
        })
    );

    const partnerA = oid();
    const partnerB = oid();
    const buyer = oid();

    await Order.create({
        user: buyer,
        items: [
            { foodItem: oid(), quantity: 1, priceAtOrder: 10, foodPartner: partnerA },
            { foodItem: oid(), quantity: 1, priceAtOrder: 20, foodPartner: partnerB }
        ]
    });

    // The scoping filter used by updateOrderStatus / getPartnerOrderById.
    assert.ok(
        await Order.findOne({ _id: { $exists: true }, 'items.foodPartner': partnerA }),
        'partner A must match the shared order'
    );
    assert.equal(
        await Order.findOne({ 'items.foodPartner': oid() }),
        null,
        'an unrelated partner must not match'
    );
    assert.ok(await Order.findOne({ user: buyer }), 'the buyer must still see their own order');
});

// ---------- transactions are genuinely available in this harness ----------

test('replica set allows the transaction-gated write paths', needsDb, async () => {
    const { supportsTransactions } = await import('../src/services/transactionSupport.js');
    assert.equal(await supportsTransactions(), true, 'a replica set must enable transactions here');
});