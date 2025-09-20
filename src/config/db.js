const { Pool } = require('pg');
const {
  PGHOST,
  PGPORT,
  PGUSER,
  PGPASSWORD,
  PGDATABASE
} = process.env;

const pool = new Pool({
  host: PGHOST || 'localhost',
  port: PGPORT ? Number(PGPORT) : 5432,
  user: PGUSER || 'postgres',
  password: PGPASSWORD || 'postgres',
  database: PGDATABASE || 'task_manager_db',
  max: 10,
  idleTimeoutMillis: 30000
});

module.exports = { pool };
