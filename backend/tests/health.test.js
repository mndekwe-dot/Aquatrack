const request = require('supertest');
const { app, sequelize, resetDB } = require('./helpers');

beforeAll(async () => {
  await resetDB();
});

afterAll(async () => {
  await sequelize.close();
});

describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('unknown routes', () => {
  it('returns 404 with a message', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Route not found');
  });
});
