const { body, validationResult } = require('express-validator');
const authService = require('../services/authService');

const register = [
  // validators
  body('username').isLength({ min: 3, max: 100 }).withMessage('username 3-100 chars'),
  body('email').isEmail().withMessage('valid email required'),
  body('password').isLength({ min: 6 }).withMessage('password min 6 chars'),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { username, email, password } = req.body;

      // uniqueness checks
      const existing = await authService.findUserByEmail(email);
      if (existing) return res.status(409).json({ error: 'Email already in use' });

      const user = await authService.createUser({ username, email, password });
      const token = authService.signToken({ user_id: user.id });
      res.status(201).json({ token, user });
    } catch (err) {
      next(err);
    }
  }
];

const login = [
  body('email').isEmail(),
  body('password').exists(),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;
      const user = await authService.verifyCredentials(email, password);
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const token = authService.signToken({ user_id: user.id });
      res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (err) {
      next(err);
    }
  }
];

module.exports = { register, login };
