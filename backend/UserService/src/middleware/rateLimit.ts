import rateLimit from 'express-rate-limit';

// Login limiter (protect against bruteforce)
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 login requests per windowMs
  message: { message: 'Too many login attempts, please wait a minute.' },
});

// Register limiter
export const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: {
    message: 'Too many accounts created from this IP, please try later.',
  },
});
