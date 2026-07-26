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

const validHousehold = {
  full_name: 'Jean Claude Nkurunziza',
  phone: '0781234001',
  password: 'citizen123',
  district: 'Gasabo',
  sector: 'Kimironko',
  meter_id: 'KAM-001',
};

describe('POST /api/households/register', () => {
  it('rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/households/register')
      .send({ full_name: 'No Phone' });
    expect(res.status).toBe(400);
  });

  it('registers a new household and returns a token', async () => {
    const res = await request(app)
      .post('/api/households/register')
      .send(validHousehold);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('citizen');
  });

  it('rejects a duplicate phone number', async () => {
    const res = await request(app)
      .post('/api/households/register')
      .send({ ...validHousehold, meter_id: 'KAM-002' });
    expect(res.status).toBe(409);
  });

  it('rejects a meter_id already linked to another household', async () => {
    const res = await request(app)
      .post('/api/households/register')
      .send({ ...validHousehold, phone: '0781234099' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/households/login', () => {
  it('rejects the wrong password', async () => {
    const res = await request(app)
      .post('/api/households/login')
      .send({ phone: validHousehold.phone, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/households/login')
      .send({ phone: validHousehold.phone, password: validHousehold.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });
});

describe('citizen profile routes', () => {
  let citizenToken;
  let staffToken;

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/households/login')
      .send({ phone: validHousehold.phone, password: validHousehold.password });
    citizenToken = login.body.token;

    const staffLogin = await request(app)
      .post('/api/staff/login')
      .send({ email: 'admin@wasac.rw', password: 'Admin@123' });
    staffToken = staffLogin.body.token;
  });

  it('GET /me returns the profile without a password field', async () => {
    const res = await request(app)
      .get('/api/households/me')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(200);
    expect(res.body.full_name).toBe(validHousehold.full_name);
    expect(res.body.password).toBeUndefined();
  });

  it('staff accounts are blocked from citizen-only routes', async () => {
    const res = await request(app)
      .get('/api/households/me')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(403);
  });

  it('PUT /me updates the profile', async () => {
    const res = await request(app)
      .put('/api/households/me')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ full_name: 'Jean Claude Updated' });
    expect(res.status).toBe(200);
    expect(res.body.full_name).toBe('Jean Claude Updated');
  });

  it('staff can list all households', async () => {
    const res = await request(app)
      .get('/api/households')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
