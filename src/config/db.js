const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,       // task_admin
  host: process.env.DB_HOST,       // localhost
  database: process.env.DB_NAME,   // task_manager
  password: process.env.DB_PASSWORD, // Task@1234
  port: process.env.DB_PORT,       // 5432
});

module.exports = pool;
