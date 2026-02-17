import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requests per window
  message: 'Too many payment requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests, please try again later'
});

export const authRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5, // 5 login attempts per 10 minutes
  message: 'Too many login attempts, please try again later'
});