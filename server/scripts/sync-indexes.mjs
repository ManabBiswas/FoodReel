/**
 * Reconcile the declared schema indexes with the indexes actually in the database.
 *
 * The app sets autoIndex:false in production, which is the right default (an
 * index build on a large collection should not happen silently on boot), but it
 * means indexes only exist if something built them deliberately. Run this as a
 * deploy step.
 *
 * It also fixes a trap the data sweep found: MongoDB cannot change an existing
 * index's options in place. The schema declared
 * `paymentDetails.razorpayOrderId` as unique+sparse, but a plain non-unique
 * index of the same name had been created earlier, so the constraint was never
 * actually applied and duplicates were accepted. This drops and recreates it.
 *
 *   node scripts/sync-indexes.mjs           # dry run
 *   node scripts/sync-indexes.mjs --apply   # make the changes
 */

import mongoose from 'mongoose';
import 'dotenv/config';

// Importing the models registers their schemas, which is where the declared
// indexes come from. Referencing mongoose.model() without this throws.
import '../src/models/order.model.js';
import '../src/models/food.model.js';
import '../src/models/user.Model.js';
import '../src/models/review.model.js';
import '../src/models/cart.model.js';
import '../src/models/foodPartner.Model.js';
import '../src/models/FoodFestTicket.model.js';
import '../src/models/FoodFestTier.model.js';
import '../src/models/FoodFestEvent.model.js';

const APPLY = process.argv.includes('--apply');

/** Collections whose declared indexes we manage. */
const MODELS = () => [
    mongoose.model('Order'),
    mongoose.model('food'),
    mongoose.model('User'),
    mongoose.model('Review'),
    mongoose.model('Cart'),
    mongoose.model('FoodPartner'),
    mongoose.model('FoodFestTicket'),
    mongoose.model('FoodFestTier'),
    mongoose.model('FoodFestEvent'),
];

const spec = (index) => ({
    unique: index.unique === true,
    sparse: index.sparse === true,
    partialFilterExpression: index.partialFilterExpression,
});

const sameSpec = (a, b) => {
    const x = spec(a);
    const y = spec(b);
    if (x.unique !== y.unique || x.sparse !== y.sparse) return false;
    return JSON.stringify(x.partialFilterExpression ?? null) === JSON.stringify(y.partialFilterExpression ?? null);
};

/** Two indexes cover the same query path if their key patterns are identical. */
const sameKey = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const keyLabel = (fields) =>
    Object.entries(fields).map(([k, v]) => `${k}:${v}`).join(', ');

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/FoodReel', {
        serverSelectionTimeoutMS: 8000,
    });
    console.log(`connected: ${mongoose.connection.name} @ ${mongoose.connection.host}`);
    console.log(APPLY ? 'MODE: APPLY (will write)' : 'MODE: DRY RUN (no writes)\n');

    let created = 0;
    let rebuilt = 0;
    let ok = 0;
    let failed = 0;

    for (const model of MODELS()) {
        const declared = model.schema.indexes();
        if (!declared.length) continue;
        const existing = await model.collection.indexes();
        console.log(`\n${model.modelName}  (${model.collection.collectionName})`);

        for (const [fields, options] of declared) {
            // Match on the key pattern, not the name. Mongoose does not populate
            // options.name from schema.indexes(), and the database may hold the
            // same key under a different generated name.
            const current = existing.find((i) => sameKey(i.key, fields));
            const label = keyLabel(fields);

            if (!current) {
                console.log(`  + create  { ${label} }`);
                if (APPLY) {
                    try {
                        await model.collection.createIndex(fields, options);
                        created++;
                    } catch (e) {
                        console.log(`    FAILED: ${e.message}`);
                        failed++;
                    }
                } else created++;
                continue;
            }

            if (!sameSpec(current, options)) {
                // Option drift. Mongo cannot alter an index in place, so it must be
                // dropped and rebuilt — only safe once the data satisfies the new
                // options, which is what the repair script verifies.
                console.log(
                    `  ~ rebuild { ${label} }  (db: unique=${current.unique === true} sparse=${current.sparse === true}` +
                    ` -> schema: unique=${options.unique === true} sparse=${options.sparse === true})`
                );
                if (APPLY) {
                    try {
                        await model.collection.dropIndex(current.name);
                        await model.collection.createIndex(fields, options);
                        rebuilt++;
                    } catch (e) {
                        console.log(`    FAILED: ${e.message}`);
                        failed++;
                    }
                } else rebuilt++;
                continue;
            }

            console.log(`  = ok      { ${label} }`);
            ok++;
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`${ok} already correct, ${created} to create, ${rebuilt} to rebuild${failed ? `, ${failed} FAILED` : ''}`);
    if (!APPLY && (created || rebuilt)) console.log('Re-run with --apply to make these changes.');
    if (failed) process.exitCode = 1;

    await mongoose.disconnect();
};

run().catch(async (e) => {
    console.error('index sync error:', e.message);
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
});
