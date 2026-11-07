import mongoose from 'mongoose';

const COLLECTION = 'ratelimitcounters';

const counterModel = () =>
    mongoose.models[COLLECTION] ||
    mongoose.model(
        COLLECTION,
        new mongoose.Schema(
            {
                // _id is the limiter prefix plus the client key, so two limiters
                // with different windows never share a bucket.
                _id: { type: String },
                totalHits: { type: Number, default: 0 },
                resetAt: { type: Date, required: true }
            },
            { versionKey: false }
        )
    );

let ready = null;
const ensureReady = async () => {
    if (ready) return ready;

    const attempt = (async () => {
        if (mongoose.connection.readyState !== 1) return false;
        // TTL reaps expired buckets, so the collection cannot grow forever.
        await counterModel().collection.createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 });
        return true;
    })().catch((error) => {
        console.error('[ratelimit] store init failed, using memory:', error.message);
        return false;
    });

    ready = attempt;
    const result = await attempt;

    // Not ready (still connecting, or the index failed): forget the cached
    // promise so a later request retries once Mongo is actually up.
    if (!result) ready = null;
    return result;
};

const MAX_LOCAL_ENTRIES = 5000;

export class MongoRateLimitStore {
    /**
     * @param {{ windowMs: number, prefix: string }} options
     */
    constructor({ windowMs, prefix }) {
        if (!prefix) {
            throw new Error(
                'MongoRateLimitStore requires an explicit, unique prefix per limiter'
            );
        }
        this.windowMs = windowMs;
        this.prefix = prefix;
        this.local = new Map();
    }

    #id(key) {
        return `${this.prefix}:${key}`;
    }

    /** Returns true if the database is reachable. */                       
    isStoreActive() {
        return mongoose.connection.readyState === 1;
    }

    /** Drop expired fallback entries so a long outage cannot exhaust memory. */
    #sweepLocal(now) {
        if (this.local.size <= MAX_LOCAL_ENTRIES) return;
        for (const [id, entry] of this.local) {
            if (entry.resetAt <= now) this.local.delete(id);
        }
        // Still oversized (all entries current): bound it regardless.
        if (this.local.size > MAX_LOCAL_ENTRIES) {
            const excess = this.local.size - MAX_LOCAL_ENTRIES;
            let dropped = 0;
            for (const id of this.local.keys()) {
                this.local.delete(id);
                if (++dropped >= excess) break;
            }
        }
    }

    /** In-window counting, mirroring the Mongo semantics exactly. */
    #localBump(key) {
        const now = Date.now();
        const id = this.#id(key);
        let entry = this.local.get(id);

        if (!entry || entry.resetAt <= now) {
            entry = { totalHits: 0, resetAt: now + this.windowMs };
        }
        entry.totalHits += 1;
        this.local.set(id, entry);

        // Swept after inserting so the map settles at or below the cap rather
        // than one entry over it.
        this.#sweepLocal(now);
        return { totalHits: entry.totalHits, resetTime: new Date(entry.resetAt) };
    }

    /**
     * Record one shared hit in a single round-trip.
     */
    async #bump(key) {
        const isReady = await ensureReady();
        if (!isReady || !this.isStoreActive()) return null;

        const Counter = counterModel();
        const now = new Date();
        const nextReset = new Date(now.getTime() + this.windowMs);
        const _id = this.#id(key);

        const isExpired = { $lte: ['$resetAt', now] };

        try {
            const doc = await Counter.findOneAndUpdate(
                { _id },
                [
                    {
                        $set: {
                            // Expired -> this hit is the first of a new window.
                            // Active   -> count it, leaving resetAt untouched so
                            //             the window cannot slide forever.
                            totalHits: {
                                $cond: [
                                    isExpired,
                                    1,
                                    { $add: [{ $ifNull: ['$totalHits', 0] }, 1] }
                                ]
                            },
                            resetAt: { $cond: [isExpired, nextReset, '$resetAt'] }
                        }
                    }
                ],
                { upsert: true, new: true }
            );

            return { totalHits: doc.totalHits, resetTime: doc.resetAt };
        } catch (error) {
            // Two concurrent first requests race on the upsert; the loser gets a
            // duplicate-key error and retries as a plain increment.
            if (error?.code === 11000) {
                const doc = await Counter.findOneAndUpdate(
                    { _id },
                    { $inc: { totalHits: 1 } },
                    { new: true }
                );
                if (doc) return { totalHits: doc.totalHits, resetTime: doc.resetAt };
            }
            throw error;
        }
    }

    async increment(key) {
        try {
            const shared = await this.#bump(key);
            if (shared) return shared;
        } catch (error) {
            console.error('[ratelimit] store unavailable, using memory:', error.message);
        }
        // Degrade to in-process counting, never to "no limit".
        return this.#localBump(key);
    }

    async decrement(key) {
        const id = this.#id(key);
        const local = this.local.get(id);
        if (local) local.totalHits = Math.max(0, local.totalHits - 1);

        if (!this.isStoreActive()) return;
        try {
            // $gt guard so a decrement can never drive the shared counter
            // negative, matching the Math.max(0, ...) used for local entries.
            await counterModel().updateOne({ _id: id, totalHits: { $gt: 0 } }, { $inc: { totalHits: -1 } });
        } catch (error) {
            console.error('[ratelimit] decrement failed:', error.message);
        }
    }

    async resetKey(key) {
        const id = this.#id(key);
        this.local.delete(id);

        if (!this.isStoreActive()) return;
        try {
            await counterModel().deleteOne({ _id: id });
        } catch (error) {
            console.error('[ratelimit] resetKey failed:', error.message);
        }
    }

    async resetAll() {
        const pattern = new RegExp(`^${escapeRegExp(this.prefix)}:`);
        for (const id of [...this.local.keys()]) {
            if (pattern.test(id)) this.local.delete(id);
        }

        if (!this.isStoreActive()) return;
        try {
            await counterModel().deleteMany({ _id: pattern });
        } catch (error) {
            console.error('[ratelimit] resetAll failed:', error.message);
        }
    }

    /** Test seam: drop the cached readiness promise. */
    static resetReadiness() {
        ready = null;
    }
}

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Build a store for a limiter, or undefined so express-rate-limit falls back to
 * its own MemoryStore (no database configured at all).
 */
export const buildStore = ({ windowMs, prefix }) => {
    if (!process.env.MONGODB_URL) return undefined;
    return new MongoRateLimitStore({ windowMs, prefix });
};