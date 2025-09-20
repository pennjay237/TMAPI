const { query, body, param, validationResult } = require('express-validator');
const taskModel = require('../models/taskModel');
const taskService = require('../services/taskService');

const listTasks = [
  // query validators
  query('status').optional().isIn(['todo', 'in-progress', 'done']),
  query('due_before').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { status, due_before, limit = 10, offset = 0, sort_by, sort_dir } = req.query;
      // If user is authenticated, show tasks created_by or assigned_to to them or public unassigned tasks.
      // For simplicity we'll return:
      // - if authenticated: tasks where created_by = user OR assigned_to = user OR assigned_to IS NULL
      // - if not authenticated: only tasks where assigned_to IS NULL
      const opts = { status, due_before, limit, offset, sort_by, sort_dir };
      let rows = await taskModel.list(opts);

      if (req.user) {
        const uid = req.user.user_id;
        rows = rows.filter(t => t.created_by === uid || t.assigned_to === uid || t.assigned_to === null);
      } else {
        rows = rows.filter(t => t.assigned_to === null);
      }

      res.json({ count: rows.length, tasks: rows });
    } catch (err) {
      next(err);
    }
  }
];

const getTaskById = [
  param('id').isInt().toInt(),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const uid = req.user.user_id;
      const task = await taskService.getTaskForUser(Number(id), uid);
      res.json(task);
    } catch (err) {
      next(err);
    }
  }
];

const createTask = [
  body('title').isLength({ min: 1, max: 255 }),
  body('description').optional().isString(),
  body('due_date').optional().isISO8601(),
  body('assigned_to').optional().isInt({ min: 1 }).toInt(),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { title, description, due_date, assigned_to } = req.body;
      const created_by = req.user.user_id;

      const task = await taskService.createTask({ title, description, due_date, assigned_to, created_by });
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }
];

const updateTask = [
  param('id').isInt().toInt(),
  body('title').optional().isLength({ min: 1, max: 255 }),
  body('description').optional().isString(),
  body('due_date').optional().isISO8601(),
  body('assigned_to').optional().isInt({ min: 1 }).toInt(),
  body('status').optional().isIn(['todo','in-progress','done']),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const changes = {};
      const allowed = ['title','description','due_date','assigned_to','status'];
      for (const k of allowed) {
        if (req.body[k] !== undefined) changes[k] = req.body[k];
      }

      const updated = await taskService.updateTask(Number(req.params.id), req.user.user_id, changes);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
];

const deleteTask = [
  param('id').isInt().toInt(),
  async (req, res, next) => {
    try {
      const deleted = await taskService.deleteTask(Number(req.params.id), req.user.user_id);
      res.json({ deleted });
    } catch (err) {
      next(err);
    }
  }
];

const completeTask = [
  param('id').isInt().toInt(),
  async (req, res, next) => {
    try {
      const updated = await taskService.updateTask(Number(req.params.id), req.user.user_id, { status: 'done' });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
];

module.exports = { listTasks, getTaskById, createTask, updateTask, deleteTask, completeTask };
