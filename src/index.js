require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(async () => {
    await pool.end();
    console.log('Pool ended, exiting.');
    process.exit(0);
  });
});
