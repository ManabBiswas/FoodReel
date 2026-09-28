import rateLimit from 'express-rate-limit';

// Rate limiting is skipped ONLY when the environment explicitly says it is a
// throwaway dev/test context. The previous check (`!== 'production'`) failed
// OPEN: with NODE_ENV unset — the default, and what the Render service was
// actually running — every limiter in the app was disabled. Set
// NODE_ENV=development in .env to get the old local-dev behaviour.
const RATE_LIMIT_EXEMPT_ENVS = new Set(['development', 'test']);
const skipInDev = () => RATE_LIMIT_EXEMPT_ENVS.has(process.env.NODE_ENV);

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
