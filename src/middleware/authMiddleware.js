const jwt = require('jsonwebtoken');
const { findUserById } = require('../services/authService');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function parseToken(req) {
  const header = req.headers.authorization;
  if (!header) return null;
  const parts = header.split(' ');
  if (parts.length !== 2) return null;
  const scheme = parts[0];
  const token = parts[1];
  if (!/^Bearer$/i.test(scheme)) return null;
  return token;
}

const authenticate = {
  required: async (req, res, next) => {
    try {
      const token = parseToken(req);
      if (!token) return res.status(401).json({ error: 'Token required' });

      let payload;
      try {
        payload = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      req.user = payload;
      // Optionally attach full user
      const user = await findUserById(payload.user_id);
      if (!user) return res.status(401).json({ error: 'User not found' });
      req.user.user = user;
      next();
    } catch (err) {
      next(err);
    }
  },

  optional: async (req, res, next) => {
    try {
      const token = parseToken(req);
      if (!token) return next();
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        const user = await findUserById(payload.user_id);
        if (user) req.user.user = user;
      } catch (err) {
        // ignore invalid token for optional auth
      }
      next();
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { authenticate };
