import rateLimit from 'express-rate-limit';

// Rate limiting is a production concern only. Local development churns through limits fast (checkAuth fires 3 verify calls per page load, plus cart/partner context fetches), and NODE_ENV is usually unset locally — without this skip, dev hits 429 within a few page loads.
const skipInDev = () => process.env.NODE_ENV !== 'production';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30, // Shared across payment create/verify/refund — 10 let a couple of
           // failed checkouts lock a user out of paying entirely.
  message: 'Too many payment requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
});

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300, // Per-IP (trust proxy is set).  
  // a single page load fires ~7 API calls (3 auth verifies + cart + contexts).
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
});

export const authRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10, // 10 login attempts per 10 minutes
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
});

export const contactRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 5, // 5 contact-form submissions per hour
    message: 'Too many messages sent, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInDev,
});

// Dashboard polling is chatty by design, but a live view must not become an amplification vector. 120 reads/min is far above any human refresh rate.
export const adminRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    message: 'Too many admin requests, please slow down',
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInDev,
});
