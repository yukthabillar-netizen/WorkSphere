const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');

const signAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessTtl,
  });
};

const signRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshTtl,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const getRefreshCookieOptions = () => {
  const isProd = config.env === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/',
  };
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  getRefreshCookieOptions,
};
