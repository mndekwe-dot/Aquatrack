const request = require('supertest');
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

describe('POST /api/staff/login', () => {
  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/staff/login')
      .send({ email: 'admin@wasac.rw', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('rejects unknown email', async () => {
    const res = await request(app)
      .post('/api/staff/login')
      .send({ email: 'nobody@wasac.rw', password: 'Admin@123' });
    expect(res.status).toBe(401);
  });

  it('logs in with correct credentials and returns a token', async () => {
    const res = await request(app)
      .post('/api/staff/login')
      .send({ email: 'admin@wasac.rw', password: 'Admin@123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toMatchObject({ email: 'admin@wasac.rw', role: 'admin' });
  });
});

describe('staff-only routes', () => {
  let adminToken;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/staff/login')
      .send({ email: 'admin@wasac.rw', password: 'Admin@123' });
    adminToken = res.body.token;
  });

  it('rejects GET /api/staff/me with no token', async () => {
    const res = await request(app).get('/api/staff/me');
    expect(res.status).toBe(401);
  });

  it('returns the logged-in staff profile without a password field', async () => {
    const res = await request(app)
      .get('/api/staff/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('admin@wasac.rw');
    expect(res.body.password).toBeUndefined();
  });

  it('lets an admin create a new staff account', async () => {
    const res = await request(app)
      .post('/api/staff/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'John Mugabo', email: 'john@wasac.rw', temp_password: 'Temp@123' });
    expect(res.status).toBe(201);
    expect(res.body.staff.email).toBe('john@wasac.rw');
  });

  it('rejects a duplicate staff email', async () => {
    const res = await request(app)
      .post('/api/staff/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'John Mugabo 2', email: 'john@wasac.rw', temp_password: 'Temp@123' });
    expect(res.status).toBe(409);
  });

  it('a non-admin staff member cannot list staff accounts', async () => {
    const loginRes = await request(app)
      .post('/api/staff/login')
      .send({ email: 'john@wasac.rw', password: 'Temp@123' });
    const staffToken = loginRes.body.token;

    const res = await request(app)
      .get('/api/staff')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/staff/change-password', () => {
  let staffToken;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/staff/login')
      .send({ email: 'john@wasac.rw', password: 'Temp@123' });
    staffToken = loginRes.body.token;
  });

  it('rejects the wrong current password', async () => {
    const res = await request(app)
      .post('/api/staff/change-password')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ current_password: 'wrong', new_password: 'NewPass123' });
    expect(res.status).toBe(401);
  });

  it('rejects a new password under 6 characters', async () => {
    const res = await request(app)
      .post('/api/staff/change-password')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ current_password: 'Temp@123', new_password: '123' });
    expect(res.status).toBe(400);
  });

  it('changes the password and clears must_change_password', async () => {
    const res = await request(app)
      .post('/api/staff/change-password')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ current_password: 'Temp@123', new_password: 'NewPass123' });
    expect(res.status).toBe(200);

    const relogin = await request(app)
      .post('/api/staff/login')
      .send({ email: 'john@wasac.rw', password: 'NewPass123' });
    expect(relogin.status).toBe(200);
    expect(relogin.body.must_change_password).toBe(false);
  });
});
