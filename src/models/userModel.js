const { pool } = require('../config/db');

async function getById(id) {
  const res = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [id]);
  return res.rows[0];
}

async function getByEmail(email) {
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0];
}

module.exports = { getById, getByEmail };
