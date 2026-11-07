/**
 * Tiny in-process TTL cache.
 *
 * Dashboard polling from several admins would otherwise run the same
 * aggregation many times per second. A short TTL collapses that burst into a
 * single database query.
 *
 * Note: this is per-instance. On a multi-instance deploy each instance keeps its
 * own cache, which still removes most of the duplicate load.
 */
export const createCache = (ttlMs) => {
    let value
    let expiresAt = 0
    let inFlight = null

    const read = () => {
        if (Date.now() < expiresAt) return value
        return undefined
    }

    return {
        /** Cached value, or undefined when stale. */
        get: read,

        /**
         * Returns the cached value, otherwise runs `producer` once even if many
         * callers arrive while it is still running (no thundering herd).
         */
        async resolve(producer) {
            const fresh = read()
            if (fresh !== undefined) return fresh
            if (inFlight) return inFlight

            inFlight = (async () => {
                try {
                    const produced = await producer()
                    value = produced
                    expiresAt = Date.now() + ttlMs
                    return produced
                } catch (err) {
                    expiresAt = 0
                    throw err
                } finally {
                    inFlight = null
                }
            })()

            return inFlight
        },

        invalidate() {
            value = undefined
            expiresAt = 0
        },
    }
}
