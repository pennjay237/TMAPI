const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hash');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

async function createUser({ username, email, password }) {
  const password_hash = await hashPassword(password);
  const client = await pool.connect();
  try {
    const res = await client.query(
      `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at`,
      [username, email, password_hash]
    );
    return res.rows[0];
  } finally {
    client.release();
  }
}

async function findUserByEmail(email) {
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0];
}

async function findUserById(id) {
  const res = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [id]);
  return res.rows[0];
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function verifyCredentials(email, password) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await comparePassword(password, user.password_hash);
  if (!ok) return null;
  // strip password_hash
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  createUser,
  findUserByEmail,
  signToken,
  verifyCredentials,
  findUserById
};
