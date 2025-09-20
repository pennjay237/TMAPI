require('dotenv').config();
const { pool } = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding database...');
    await client.query('BEGIN');

    // Remove existing
    await client.query('DELETE FROM tasks');
    await client.query('DELETE FROM users');

    // Create 3 users
    const pw1 = await bcrypt.hash('Password1!', 10);
    const pw2 = await bcrypt.hash('Password2!', 10);
    const pw3 = await bcrypt.hash('Password3!', 10);

    const users = [];
    const u1 = await client.query(
      `INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3) RETURNING *`,
      ['alice', 'alice@example.com', pw1]
    );
    users.push(u1.rows[0]);

    const u2 = await client.query(
      `INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3) RETURNING *`,
      ['bob', 'bob@example.com', pw2]
    );
    users.push(u2.rows[0]);

    const u3 = await client.query(
      `INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3) RETURNING *`,
      ['carol', 'carol@example.com', pw3]
    );
    users.push(u3.rows[0]);

    // Create 10 tasks with mix of statuses and assignments
    const now = new Date();
    const tasks = [
      ['Task 1', 'Unassigned todo', null, null, users[0].id],
      ['Task 2', 'Assigned to Bob in-progress', new Date(now.getTime() + 86400000), users[1].id, users[0].id],
      ['Task 3', 'Done by Alice', new Date(now.getTime() + 3600000), users[0].id, users[0].id],
      ['Task 4', 'Assigned to Carol todo', new Date(now.getTime() + 5 * 86400000), users[2].id, users[1].id],
      ['Task 5', 'Unassigned future', new Date(now.getTime() + 10 * 86400000), null, users[1].id],
      ['Task 6', 'Bob created in-progress', new Date(now.getTime() + 2 * 86400000), users[2].id, users[1].id],
      ['Task 7', 'Carol created todo', new Date(now.getTime() + 3 * 86400000), null, users[2].id],
      ['Task 8', 'Overdue task', new Date(now.getTime() - 2 * 86400000), users[0].id, users[2].id],
      ['Task 9', 'Another done', null, users[1].id, users[2].id],
      ['Task 10', 'Misc task', null, null, users[0].id]
    ];

    for (let i = 0; i < tasks.length; i++) {
      const [title, desc, due_date, assigned_to, created_by] = tasks[i];
      let status = 'todo';
      if (title.toLowerCase().includes('in-progress')) status = 'in-progress';
      if (title.toLowerCase().includes('done')) status = 'done';
      await client.query(
        `INSERT INTO tasks (title, description, due_date, assigned_to, created_by, status)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [title, desc, due_date, assigned_to, created_by, status]
      );
    }

    await client.query('COMMIT');
    console.log('Seeding complete');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Seed error', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
