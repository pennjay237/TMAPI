const { pool } = require('../config/db');
const taskModel = require('../models/taskModel');

async function createTask(data) {
  // validate business rule: due_date cannot be in the past
  if (data.due_date) {
    const due = new Date(data.due_date);
    if (isNaN(due.getTime())) throw { status: 400, message: 'Invalid due_date' };
    const now = new Date();
    if (due < now) throw { status: 400, message: 'due_date must be in the future' };
  }
  return taskModel.create(data);
}

async function getTaskForUser(taskId, userId) {
  const task = await taskModel.getById(taskId);
  if (!task) throw { status: 404, message: 'Task not found' };
  // allowed if created_by or assigned_to equals userId
  if (task.created_by !== userId && task.assigned_to !== userId) {
    throw { status: 403, message: 'Forbidden' };
  }
  return task;
}

async function updateTask(taskId, userId, changes) {
  // transaction: lock the task row to avoid race conditions
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query('SELECT * FROM tasks WHERE id = $1 FOR UPDATE', [taskId]);
    const task = res.rows[0];
    if (!task) {
      await client.query('ROLLBACK');
      throw { status: 404, message: 'Task not found' };
    }
    if (task.created_by !== userId && task.assigned_to !== userId) {
      await client.query('ROLLBACK');
      throw { status: 403, message: 'Forbidden' };
    }
    // Validate status transitions
    if (changes.status) {
      const allowed = ['todo', 'in-progress', 'done'];
      if (!allowed.includes(changes.status)) {
        await client.query('ROLLBACK');
        throw { status: 400, message: 'Invalid status' };
      }
      if (task.status === 'done' && changes.status !== 'done') {
        // Forbid moving from done back to todo/in-progress without reset flag
        await client.query('ROLLBACK');
        throw { status: 409, message: 'Cannot move from done to previous status' };
      }
      if (changes.status === 'done' && task.status !== 'done') {
        changes.completed_at = new Date();
      }
    }
    // If assigned_to changed, ensure user exists
    if (changes.assigned_to) {
      const u = await client.query('SELECT id FROM users WHERE id = $1', [changes.assigned_to]);
      if (!u.rows.length) {
        await client.query('ROLLBACK');
        throw { status: 400, message: 'Assigned user does not exist' };
      }
    }

    // Build update query
    const keys = Object.keys(changes);
    const values = keys.map(k => changes[k]);
    const set = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const idx = keys.length + 1;
    const updateQuery = `UPDATE tasks SET ${set} WHERE id = $${idx} RETURNING *`;
    const updated = (await client.query(updateQuery, [...values, taskId])).rows[0];

    await client.query('COMMIT');
    return updated;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function deleteTask(taskId, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query('SELECT * FROM tasks WHERE id = $1 FOR UPDATE', [taskId]);
    const task = res.rows[0];
    if (!task) {
      await client.query('ROLLBACK');
      throw { status: 404, message: 'Task not found' };
    }
    if (task.created_by !== userId) {
      await client.query('ROLLBACK');
      throw { status: 403, message: 'Only creator can delete task' };
    }
    const deleted = (await client.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [taskId])).rows[0];
    await client.query('COMMIT');
    return deleted;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { createTask, getTaskForUser, updateTask, deleteTask };
