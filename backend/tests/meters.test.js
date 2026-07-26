const request = require('supertest');
const { app, sequelize, resetDB } = require('./helpers');
const Staff = require('../apps/staff/staff.model');
const Household = require('../apps/households/household.model');

let staffToken;
let citizenToken;
let meterId;
let householdId;

beforeAll(async () => {
  await resetDB();
  await Staff.create({
    name: 'Admin WASAC',
    email: 'admin@wasac.rw',
    password: 'Admin@123',
    role: 'admin',
  });
  const household = await Household.create({
    full_name: 'Jean Claude Nkurunziza',
    phone: '0781234001',
    password: 'citizen123',
    district: 'Gasabo',
    sector: 'Kimironko',
    meter_id: 'KAM-999',
  });
  householdId = household.id;

  const staffLogin = await request(app)
    .post('/api/staff/login')
    .send({ email: 'admin@wasac.rw', password: 'Admin@123' });
  staffToken = staffLogin.body.token;

  const citizenLogin = await request(app)
    .post('/api/households/login')
    .send({ phone: '0781234001', password: 'citizen123' });
  citizenToken = citizenLogin.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('meters access control', () => {
  it('rejects requests with no token', async () => {
    const res = await request(app).get('/api/meters');
    expect(res.status).toBe(401);
  });

  it('rejects citizens from the staff-only meters list', async () => {
    const res = await request(app)
      .get('/api/meters')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(403);
  });
});

describe('meters CRUD', () => {
  it('staff can create a meter linked to a household', async () => {
    const res = await request(app)
      .post('/api/meters')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ serial_number: 'KAM-001', installation_date: '2025-01-15', household_id: householdId });
    expect(res.status).toBe(201);
    expect(res.body.serial_number).toBe('KAM-001');
    meterId = res.body.id;
  });

  it('staff can list meters including the new one', async () => {
    const res = await request(app)
      .get('/api/meters')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(200);
    expect(res.body.some(m => m.serial_number === 'KAM-001')).toBe(true);
  });

  it('recording a reading computes consumption_delta from last_reading', async () => {
    const res = await request(app)
      .patch(`/api/meters/${meterId}/reading`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ reading_value: 12.5 });
    expect(res.status).toBe(200);
    expect(res.body.consumption_delta).toBe(12.5); // last_reading defaults to 0
    expect(res.body.meter.last_reading).toBe(12.5);
  });

  it('a second reading computes the delta from the updated last_reading', async () => {
    const res = await request(app)
      .patch(`/api/meters/${meterId}/reading`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ reading_value: 20 });
    expect(res.status).toBe(200);
    expect(res.body.consumption_delta).toBe(7.5);
  });

  it('404s for a meter that does not exist', async () => {
    const res = await request(app)
      .get('/api/meters/999999')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(404);
  });
});
