import rateLimit from 'express-rate-limit';

// Global API limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests, please try again later.' },
});

// Limiter for write operations (create/update/delete)
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 write requests per minute
  message: { message: 'Too many write attempts, please slow down.' },
});
