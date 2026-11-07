/**
 * Minimal request-validation layer.
 */

export const isObjectId = (v) =>
    typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v);

export const isNonEmptyString = (v, max = 1000) =>
    typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;

export const isEmail = (v) =>
    typeof v === 'string' && v.length <= 254 && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v.trim());

export const isIntInRange = (v, min, max) =>
    Number.isInteger(v) && v >= min && v <= max;

/** Present only if provided (used for optional fields). */
export const optional = (check) => (v) => v === undefined || v === null || check(v);

/**
 * validateBody(rules) - Express middleware.
 *
 * rules: { field: { check: (value, body) => boolean, message: string } }
 * Only declared fields are checked; extra body fields pass through (each
 * handler picks what it uses). The first failure responds 400 { error }.
 */
export const validateBody = (rules) => (req, res, next) => {
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
        ? req.body
        : {};
    for (const [field, rule] of Object.entries(rules)) {
        if (!rule.check(body[field], body)) {
            return res.status(400).json({ error: rule.message });
        }
    }
    next();
};

/**
 * validateParams(rules) - same contract as validateBody but over req.params.
 * Catches malformed ObjectIds in path segments before Mongoose casts them
 * into a ValidationError 500.
 */
export const validateParams = (rules) => (req, res, next) => {
    const params = req.params || {};
    for (const [field, rule] of Object.entries(rules)) {
        if (!rule.check(params[field], params)) {
            return res.status(400).json({ error: rule.message });
        }
    }
    next();
};
