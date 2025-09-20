const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimiter = require('./middleware/rateLimiter');
const authController = require('./controllers/authController');
const taskController = require('./controllers/taskController');
const { authenticate } = require('./middleware/authMiddleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimiter); // global rate limiting

// Auth routes
app.post('/register', authController.register);
app.post('/login', authController.login);

// Task routes
app.get('/tasks', authenticate.optional, taskController.listTasks); // public reads for unassigned/filters
app.get('/tasks/:id', authenticate.required, taskController.getTaskById); // must be creator or assignee
app.post('/tasks', authenticate.required, taskController.createTask);
app.put('/tasks/:id', authenticate.required, taskController.updateTask);
app.delete('/tasks/:id', authenticate.required, taskController.deleteTask);
app.patch('/tasks/:id/complete', authenticate.required, taskController.completeTask);

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (!err.status) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
  res.status(err.status).json({ error: err.message });
});

module.exports = app;
