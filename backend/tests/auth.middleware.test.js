const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app, sequelize, resetDB } = require('./helpers');
const Staff = require('../apps/staff/staff.model');

beforeAll(async () => {
  await resetDB();
  await Staff.create({
    name: 'Admin WASAC',
    email: 'admin@wasac.rw',
    password: 'Admin@123',
    role: 'admin',
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('protect middleware', () => {
  it('rejects a request with no Authorization header', async () => {
    const res = await request(app).get('/api/staff/me');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no token/i);
  });

  it('rejects a header without the Bearer prefix', async () => {
    const res = await request(app)
      .get('/api/staff/me')
      .set('Authorization', 'not-a-bearer-token');
    expect(res.status).toBe(401);
  });

  it('rejects a malformed token', async () => {
    const res = await request(app)
      .get('/api/staff/me')
      .set('Authorization', 'Bearer not.a.valid.jwt');
    expect(res.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const expired = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '-1s' });
    const res = await request(app)
      .get('/api/staff/me')
      .set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  it('accepts a valid token signed with the app secret', async () => {
    const valid = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .get('/api/staff/me')
      .set('Authorization', `Bearer ${valid}`);
    expect(res.status).toBe(200);
  });
});
