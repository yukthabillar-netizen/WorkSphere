const rateLimit = require('express-rate-limit');

const rawAuthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 1 minute.',
  },
});

const authLimiter = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();
  return rawAuthLimiter(req, res, next);
};

const rawApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please slow down.',
  },
});

const apiLimiter = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();
  return rawApiLimiter(req, res, next);
};

module.exports = {
  authLimiter,
  apiLimiter,
};
