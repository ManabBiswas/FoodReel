/**
 * Free-text search on GET /api/food?q=...
 *
 * The term is embedded in a RegExp, so this locks two things: the match
 * itself (name and description, case-insensitive) and that regex
 * metacharacters are treated literally instead of throwing or backtracking.
 *
 * DB-backed. Skips cleanly when mongodb-memory-server cannot start.
 */
import { test, describe, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

const mongoose = (await import('mongoose')).default;
mongoose.set('strictQuery', true);

let mongoServer;
let connected = false;
let unavailableReason = 'database not started';

try {
    const { MongoMemoryReplSet } = await import('mongodb-memory-server');
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongoServer.getUri(), { dbName: 'foodreel_search_test' });
    connected = true;
} catch (error) {
    unavailableReason = `database unavailable (${error.message})`;
    console.error(`[food.search] skipping: ${unavailableReason}`);
}

after(async () => {
    if (connected) {
        await mongoose.connection.dropDatabase().catch(() => {});
        await mongoose.disconnect().catch(() => {});
    }
    if (mongoServer) await mongoServer.stop().catch(() => {});
});

const needsDb = { skip: connected ? false : unavailableReason };

const foodModel = (await import('../src/models/food.model.js')).default;
const foodPartnerModel = (await import('../src/models/foodPartner.Model.js')).default;
const foodController = (await import('../src/controllers/food.controller.js')).default;

const oid = () => new mongoose.Types.ObjectId();

const search = async (q) => {
    const req = { query: { q }, id: 'test' };
    let statusCode = 200;
    let payload;
    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(data) {
            payload = data;
            return this;
        }
    };
    await foodController.getAllFoods(req, res);
    return { statusCode, payload };
};

const mkFood = (partnerId, overrides = {}) => foodModel.create({
    name: 'Test Dish',
    description: 'Test dish',
    type: 'image',
    postType: 'food',
    price: 120,
    foodPartner: partnerId,
    ...overrides
});

describe('GET /api/food?q= free-text search', () => {
    let partnerId;

    beforeEach(async () => {
        if (!connected) return;
        await Promise.all([foodModel.deleteMany({}), foodPartnerModel.deleteMany({})]);
        const partner = await foodPartnerModel.create({
            companyName: 'Search Kitchen',
            email: `search-${oid()}@example.com`,
            password: 'hashed-password',
            mobile: '9876543210',
            address: '1 Test Street'
        });
        partnerId = partner._id;
    });

    test('matches the name case-insensitively', needsDb, async () => {
        await mkFood(partnerId, { name: 'Masala Dosa' });
        await mkFood(partnerId, { name: 'Paneer Tikka' });

        const { statusCode, payload } = await search('masala');

        assert.equal(statusCode, 200);
        assert.deepEqual(payload.data.map((food) => food.name), ['Masala Dosa']);
    });

    test('matches the description too', needsDb, async () => {
        await mkFood(partnerId, { name: 'House Special', description: 'Slow-cooked biryani' });
        await mkFood(partnerId, { name: 'Plain Rice', description: 'Steamed' });

        const { payload } = await search('BIRYANI');

        assert.deepEqual(payload.data.map((food) => food.name), ['House Special']);
    });

    test('treats regex metacharacters literally instead of throwing', needsDb, async () => {
        await mkFood(partnerId, { name: 'C++ Special' });
        await mkFood(partnerId, { name: 'Plain Toast' });

        const { statusCode, payload } = await search('(a+)+$');

        assert.equal(statusCode, 200);
        assert.equal(payload.data.length, 0);
    });

    test('a blank term is not a filter', needsDb, async () => {
        await mkFood(partnerId, { name: 'One' });
        await mkFood(partnerId, { name: 'Two' });

        const { payload } = await search('   ');

        assert.equal(payload.data.length, 2);
    });
});
