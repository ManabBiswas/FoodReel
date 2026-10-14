/**
 * Reconcile the declared schema indexes with the indexes actually in the database.
 *
 * The app sets autoIndex:false in production (db.js), which is the right
 * default (an index build on a large collection should not happen silently on
 * boot), but it means indexes only exist if something built them deliberately.
 * server.js runs this after connecting in production; scripts/sync-indexes.mjs
 * exposes the same logic as a CLI for dry runs.
 *
 * It also fixes a trap the data sweep found: MongoDB cannot change an existing
 * index's options in place. The schema declared
 * `paymentDetails.razorpayOrderId` as unique+sparse, but a plain non-unique
 * index of the same name had been created earlier, so the constraint was never
 * actually applied and duplicates were accepted. This drops and recreates it.
 *
 * Without this, the unique indexes behind idempotency (`idempotencyKey`),
 * webhook replay dedupe (`paymentWebhookEvent.eventId`) and follow-dedup are
 * silently missing in production, degrading atomic read-then-write flows.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import mongoose from 'mongoose';

const MODELS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../models');
let modelsLoaded = false;

const loadModels = async () => {
    if (modelsLoaded) return;
    for (const file of fs.readdirSync(MODELS_DIR)) {
        if (!file.endsWith('.js')) continue;
        await import(pathToFileURL(path.join(MODELS_DIR, file)).href);
    }
    modelsLoaded = true;
};

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

/**
 * @param {object} [options]
 * @param {boolean} [options.apply]  false = dry run (no writes)
 * @param {(line: string) => void} [options.log]
 * @returns {Promise<{ok:number, created:number, rebuilt:number, failed:number}>}
 */
export const syncIndexes = async ({ apply = false, log = console.log } = {}) => {
    await loadModels();

    // When the server calls us the connection is already open; the CLI needs
    // its own (and must not disconnect the server's).
    const ownsConnection = mongoose.connection.readyState !== 1;
    if (ownsConnection) {
        await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/FoodReel', {
            serverSelectionTimeoutMS: 8000,
        });
        log(`connected: ${mongoose.connection.name} @ ${mongoose.connection.host}`);
    }
    log(apply ? 'MODE: APPLY (will write)' : 'MODE: DRY RUN (no writes)\n');

    let created = 0;
    let rebuilt = 0;
    let ok = 0;
    let failed = 0;

    try {
        const models = mongoose.modelNames().sort().map((name) => mongoose.model(name));

        for (const model of models) {
            const declared = model.schema.indexes();
            if (!declared.length) continue;
            const existing = await model.collection.indexes();
            log(`\n${model.modelName}  (${model.collection.collectionName})`);

            for (const [fields, options] of declared) {
                // Match on the key pattern, not the name. Mongoose does not populate
                // options.name from schema.indexes(), and the database may hold the
                // same key under a different generated name.
                const current = existing.find((i) => sameKey(i.key, fields));
                const label = keyLabel(fields);

                if (!current) {
                    log(`  + create  { ${label} }`);
                    if (apply) {
                        try {
                            await model.collection.createIndex(fields, options);
                            created++;
                        } catch (e) {
                            log(`    FAILED: ${e.message}`);
                            failed++;
                        }
                    } else created++;
                    continue;
                }

                if (!sameSpec(current, options)) {
                    // Option drift. Mongo cannot alter an index in place, so it must be
                    // dropped and rebuilt — only safe once the data satisfies the new
                    // options, which is what the repair script verifies.
                    log(
                        `  ~ rebuild { ${label} }  (db: unique=${current.unique === true} sparse=${current.sparse === true}` +
                        ` -> schema: unique=${options.unique === true} sparse=${options.sparse === true})`
                    );
                    if (apply) {
                        try {
                            await model.collection.dropIndex(current.name);
                            await model.collection.createIndex(fields, options);
                            rebuilt++;
                        } catch (e) {
                            log(`    FAILED: ${e.message}`);
                            failed++;
                        }
                    } else rebuilt++;
                    continue;
                }

                log(`  = ok      { ${label} }`);
                ok++;
            }
        }
    } finally {
        if (ownsConnection) await mongoose.disconnect().catch(() => {});
    }

    return { ok, created, rebuilt, failed };
};
