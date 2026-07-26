const request = require('supertest');
const { app, sequelize, resetDB } = require('./helpers');
const Staff = require('../apps/staff/staff.model');
const Household = require('../apps/households/household.model');
const Meter = require('../apps/meters/meter.model');

let staffToken;
let citizenToken;
let householdId;
let meterId;
let reportId;
let issueId;

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
  householdId = household.id;
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

describe('billing reports', () => {
  it('staff can generate a billing report', async () => {
    const res = await request(app)
      .post('/api/reports/billing')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        household_id: householdId,
        meter_id: meterId,
        period_start: '2026-06-01',
        period_end: '2026-06-30',
        consumption: 14.3,
        amount_due: 5005.0,
      });
    expect(res.status).toBe(201);
    reportId = res.body.id;
  });

  it('citizen can see their own billing history', async () => {
    const res = await request(app)
      .get('/api/reports/billing/mine')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].paid).toBe(false);
  });

  it('staff can mark a report as paid', async () => {
    const res = await request(app)
      .patch(`/api/reports/billing/${reportId}/paid`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(200);
    expect(res.body.report.paid).toBe(true);
  });

  it('citizens cannot access the full billing list (staff-only)', async () => {
    const res = await request(app)
      .get('/api/reports/billing')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(403);
  });
});

describe('issue reports', () => {
  it('requires issue_type', async () => {
    const res = await request(app)
      .post('/api/reports/issues')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ description: 'no issue_type here' });
    expect(res.status).toBe(400);
  });

  it('a citizen can submit an issue report', async () => {
    const res = await request(app)
      .post('/api/reports/issues')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        issue_type: 'leak',
        duration: '2-3 days',
        description: 'Water leaking from a pipe under my sink.',
        sector: 'Kimironko',
        district: 'Gasabo',
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('open');
    issueId = res.body.id;
  });

  it('the citizen can see it under their own issues', async () => {
    const res = await request(app)
      .get('/api/reports/issues/mine')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it('staff can see and update the issue status', async () => {
    const list = await request(app)
      .get('/api/reports/issues')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(list.status).toBe(200);
    expect(list.body.some(i => i.id === issueId)).toBe(true);

    const update = await request(app)
      .patch(`/api/reports/issues/${issueId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'in_progress' });
    expect(update.status).toBe(200);
    expect(update.body.status).toBe('in_progress');
  });
});
