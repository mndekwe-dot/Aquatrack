const request = require('supertest');
const { app, sequelize, resetDB } = require('./helpers');
const Staff = require('../apps/staff/staff.model');
const Household = require('../apps/households/household.model');
const Meter = require('../apps/meters/meter.model');

let staffToken;
let citizenToken;
let meterId;
let alertId;

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
    meter_id: 'KAM-001',
  });
  const meter = await Meter.create({
    serial_number: 'KAM-001',
    household_id: household.id,
    status: 'active',
  });
  meterId = meter.id;

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

describe('alerts', () => {
  it('a citizen sees no alerts before any are created', async () => {
    const res = await request(app)
      .get('/api/alerts/mine')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('staff can create an alert for a meter', async () => {
    const res = await request(app)
      .post('/api/alerts')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        meter_id: meterId,
        type: 'leak',
        severity: 'high',
        message: 'Abnormal flow detected at night.',
      });
    expect(res.status).toBe(201);
    alertId = res.body.id;
  });

  it('the citizen who owns that meter now sees the unresolved alert', async () => {
    const res = await request(app)
      .get('/api/alerts/mine')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].type).toBe('leak');
  });

  it('staff can see the alert in the full list', async () => {
    const res = await request(app)
      .get('/api/alerts')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(200);
    expect(res.body.some(a => a.id === alertId)).toBe(true);
  });

  it('staff can resolve the alert', async () => {
    const res = await request(app)
      .patch(`/api/alerts/${alertId}/resolve`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(200);
    expect(res.body.alert.resolved).toBe(true);
  });

  it('a resolved alert no longer shows up under /mine', async () => {
    const res = await request(app)
      .get('/api/alerts/mine')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
