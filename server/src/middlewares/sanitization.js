import xss from 'xss';
import sanitize from 'mongo-sanitize';

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function sanitizeValue(val) {
  if (typeof val === 'string') return xss(val);
  if (Array.isArray(val)) return val.map(sanitizeValue);
  if (val !== null && typeof val === 'object') {
    const clean = {};
    for (const key of Object.keys(val)) {
      if (DANGEROUS_KEYS.has(key)) continue;
      clean[key] = sanitizeValue(val[key]);
    }
    return clean;
  }
  return val;
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  return sanitizeValue(sanitize(obj));
}

export const sanitizeInput = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.params) req.params = sanitizeObject(req.params);

  // req.query is read-only in Express 5 — attach sanitized copy
  if (req.query) req.sanitizedQuery = sanitizeObject({ ...req.query });

  next();
};