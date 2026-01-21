import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requests per window
  message: 'Too many payment requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
