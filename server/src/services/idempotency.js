/**
 * Idempotency-key handling for unsafe POSTs.
 *
 * The claim is the insert: a unique index on (scope, key, user) means exactly
 * one concurrent request can win. Losers do not retry the work — they either
 * replay the stored response or are told the original is still running, so a
 * retried request can never create a second order.
 */

import idempotencyKeyModel from '../models/idempotencyKey.model.js';

const MAX_KEY_LENGTH = 128;

/** Normalise a client-supplied key, rejecting anything unusable. */
export const normaliseKey = (raw) => {
    if (typeof raw !== 'string') return null;
    const key = raw.trim();
    if (!key || key.length > MAX_KEY_LENGTH) return null;
    // Allow uuid-ish and other opaque tokens, but not control characters
    if (!/^[\w.:-]+$/.test(key)) return null;
    return key;
};

/**
 * Try to claim an idempotency key.
 *
 * @returns {{claimed: true, record: object} | {claimed: false, replay?: object, inProgress?: boolean}}
 */
export const claimKey = async ({ scope, key, userId }) => {
    try {
        const record = await idempotencyKeyModel.create({ scope, key, user: userId, status: 'in_progress' });
        return { claimed: true, record };
    } catch (error) {
        if (error?.code !== 11000) throw error;

        // Someone already holds this key.
        const existing = await idempotencyKeyModel.findOne({ scope, key, user: userId }).lean();
        if (!existing) {
            // The unique index fired but the row is already gone (expired). Extremely
            // rare; treat as unclaimed rather than replaying nothing.
            return { claimed: false, inProgress: false, missing: true };
        }
        if (existing.status === 'completed') {
            return { claimed: false, replay: existing };
        }
        return { claimed: false, inProgress: true };
    }
};

/** Store the response so a later retry can replay it verbatim. */
export const completeKey = async ({ scope, key, userId, httpStatus, response }) => {
    try {
        await idempotencyKeyModel.updateOne(
            { scope, key, user: userId },
            { $set: { status: 'completed', httpStatus, response } }
        );
    } catch (error) {
        // Never fail the caller's request because bookkeeping failed.
        console.error('Failed to record idempotent response:', error.message);
    }
};

/** Drop a claim so the caller can genuinely retry after a failure. */
export const releaseKey = async ({ scope, key, userId }) => {
    try {
        await idempotencyKeyModel.deleteOne({ scope, key, user: userId, status: 'in_progress' });
    } catch (error) {
        console.error('Failed to release idempotency key:', error.message);
    }
};

/**
 * Express middleware wrapper.
 *
 * With no `Idempotency-Key` header the request passes straight through, so
 * existing clients are unaffected.
 */
export const withIdempotency = (scope) => async (req, res, next) => {
    const key = normaliseKey(req.get('idempotency-key'));
    if (!key || !req.user?._id) return next();

    const userId = req.user._id;
    const claim = await claimKey({ scope, key, userId });

    if (!claim.claimed) {
        if (claim.replay) {
            console.log(`[req:${req.id}] Replaying idempotent ${scope} response for key ${key}`);
            return res.status(claim.replay.httpStatus || 200).json({
                ...(claim.replay.response || {}),
                replayed: true,
            });
        }
        if (claim.inProgress) {
            return res.status(409).json({
                success: false,
                message: 'An identical request is still being processed',
                code: 'REQUEST_IN_PROGRESS',
            });
        }
    }

    // Record only a SUCCESSFUL response, so a retry replays the real result.
    // Errors must not burn the key: the customer fixes the problem and retries,
    // and replaying a cached 400 would refuse a request that is now valid.
    const originalJson = res.json.bind(res);
    let settled = false;
    res.json = (body) => {
        if (!settled) {
            settled = true;
            if (res.statusCode < 400) {
                completeKey({ scope, key, userId, httpStatus: res.statusCode, response: body });
            } else {
                releaseKey({ scope, key, userId });
            }
        }
        return originalJson(body);
    };

    const originalStatus = res.status.bind(res);
    res.status = (code) => {
        // A thrown error may not reach res.json at all, so release here too.
        if (code >= 500 && !settled) {
            settled = true;
            releaseKey({ scope, key, userId });
        }
        return originalStatus(code);
    };

    next();
};
