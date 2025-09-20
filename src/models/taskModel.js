const { pool } = require('../config/db');

async function create({ title, description, due_date, assigned_to, created_by }) {
  const res = await pool.query(
    `INSERT INTO tasks (title, description, due_date, assigned_to, created_by) 
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [title, description || null, due_date || null, assigned_to || null, created_by]
  );
  return res.rows[0];
}

async function getById(id) {
  const res = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
  return res.rows[0];
}

async function list({ status, due_before, limit = 10, offset = 0, sort_by = 'due_date', sort_dir = 'asc' }) {
  const clauses = [];
  const params = [];
  let idx = 1;

  if (status) {
    clauses.push(`status = $${idx++}`);
    params.push(status);
  }
  if (due_before) {
    clauses.push(`due_date <= $${idx++}`);
    params.push(due_before);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  // Basic SQL injection safety via parameterization for dynamic parts
  const allowedSort = ['due_date', 'status', 'created_at'];
  const sortColumn = allowedSort.includes(sort_by) ? sort_by : 'due_date';
  const sortDir = sort_dir.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  const query = `
    SELECT * FROM tasks
    ${where}
    ORDER BY ${sortColumn} ${sortDir}
    LIMIT $${idx++} OFFSET $${idx++}
  `;
  params.push(limit);
  params.push(offset);

  const res = await pool.query(query, params);
  return res.rows;
}

async function update(id, fields) {
  const keys = Object.keys(fields);
  if (!keys.length) return getById(id);

  const set = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = keys.map(k => fields[k]);
  const idx = keys.length + 1;

  const query = `UPDATE tasks SET ${set} WHERE id = $${idx} RETURNING *`;
  const res = await pool.query(query, [...values, id]);
  return res.rows[0];
}

async function remove(id) {
  const res = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
  return res.rows[0];
}

module.exports = { create, getById, list, update, remove };
