const rateLimit = require('express-rate-limit');

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000; // 1 minute
const max = Number(process.env.RATE_LIMIT_MAX) || 100;

const limiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down' }
});

module.exports = limiter;
