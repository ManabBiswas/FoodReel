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
  // Never touch raw Buffer bodies (e.g. the Razorpay webhook route) — they
  // must stay byte-identical for HMAC signature verification.
  if (req.body && !Buffer.isBuffer(req.body)) req.body = sanitizeObject(req.body);
  if (req.params) req.params = sanitizeObject(req.params);

  if (req.query) {
    const safeQuery = sanitizeObject({ ...req.query });
    try {
      Object.defineProperty(req, 'query', {
        value: safeQuery,
        enumerable: true,
        configurable: true,
        writable: false,
      });
    } catch (err) {
      req.sanitizedQuery = safeQuery;
    }
  }

  next();
};

// Multipart bodies are parsed by multer AFTER sanitizeInput has run, so their
// fields (and uploaded filenames) never get sanitized. Mount this right after
// upload.single()/upload.fields() on file-upload routes.
export const sanitizeMultipart = (req, res, next) => {
  if (req.body && !Buffer.isBuffer(req.body)) {
    req.body = sanitizeObject(req.body);
  }
  const sanitizeFile = (file) => {
    if (file && typeof file.originalname === 'string') {
      // Strip path separators / control chars from client-supplied filenames
      file.originalname = xss(file.originalname.replace(/[/\\]/g, '_'));
    }
  };
  if (req.file) sanitizeFile(req.file);
  if (Array.isArray(req.files)) req.files.forEach(sanitizeFile);
  else if (req.files && typeof req.files === 'object') {
    Object.values(req.files).flat().forEach(sanitizeFile);
  }
  next();
};