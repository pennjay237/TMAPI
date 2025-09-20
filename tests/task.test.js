require('dotenv').config();
const request = require('supertest');
const app = require('../app');
const { pool } = require('../config/db');

let token;
let createdTaskId;

beforeAll(async () => {
  // create a user
  const email = `testuser${Date.now()}@example.com`;
  await request(app).post('/register').send({
    username: 'tuser',
    email,
    password: 'Password1!'
  });
  const loginRes = await request(app).post('/login').send({ email, password: 'Password1!' });
  token = loginRes.body.token;
});

afterAll(async () => {
  await pool.end();
});

describe('Tasks endpoints', () => {
  it('create task', async () => {
    const res = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Task', description: 'Testing create', due_date: new Date(Date.now() + 86400000).toISOString() });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Test Task');
    createdTaskId = res.body.id;
  });

  it('list tasks (should include unassigned for public)', async () => {
    const res = await request(app).get('/tasks');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  it('get task by id forbidden if not owner', async () => {
    const res = await request(app).get(`/tasks/${createdTaskId}`);
    expect(res.statusCode).toBe(401); // because GET /tasks/:id requires auth per controller
  });

  it('complete task', async () => {
    const res = await request(app)
      .patch(`/tasks/${createdTaskId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('done');
  });

  it('delete task', async () => {
    const res = await request(app)
      .delete(`/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(res.statusCode).toBe(200);
  });
});
