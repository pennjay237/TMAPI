require('dotenv').config();
const request = require('supertest');
const app = require('../app');
const { pool } = require('../config/db');

let server;

beforeAll(async () => {
  // ensure db is ready
});

afterAll(async () => {
  await pool.end();
});

describe('Auth endpoints', () => {
  const testEmail = `test${Date.now()}@example.com`;
  it('should register a user', async () => {
    const res = await request(app).post('/register').send({
      username: 'tester',
      email: testEmail,
      password: 'Password1!'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
  });

  it('should login the user', async () => {
    const res = await request(app).post('/login').send({
      email: testEmail,
      password: 'Password1!'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('invalid login fails', async () => {
    const res = await request(app).post('/login').send({
      email: 'nope@example.com',
      password: 'bad'
    });
    expect(res.statusCode).toBe(401);
  });
});
