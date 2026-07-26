require('dotenv').config();
const sequelize = require('./config/database');
require('./models');

const Staff        = require('./apps/staff/staff.model');
const Household    = require('./apps/households/household.model');
const Meter        = require('./apps/meters/meter.model');
const MeterReading = require('./apps/meters/meter_reading.model');
const Alert        = require('./apps/alerts/alert.model');
const Report       = require('./apps/reports/report.model');
const IssueReport  = require('./apps/reports/issue_report.model');
const Notification = require('./apps/notifications/notification.model');

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function dateOnly(n) {
  return daysAgo(n).toISOString().split('T')[0];
}

function rand(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(3));
}

// ── Fleet definition ─────────────────────────────────────────────────────────
const TOTAL_METERS = 30;
const KAM_COUNT    = 16;
const SUST_COUNT   = 9;
const EOI_COUNT    = 5;

const ZONES = [
  { district: 'Gasabo',     sector: 'Kimironko'  },
  { district: 'Gasabo',     sector: 'Kacyiru'    },
  { district: 'Gasabo',     sector: 'Remera'      },
  { district: 'Kicukiro',   sector: 'Gikondo'    },
  { district: 'Kicukiro',   sector: 'Niboye'     },
  { district: 'Kicukiro',   sector: 'Kagarama'   },
  { district: 'Nyarugenge', sector: 'Nyamirambo' },
  { district: 'Nyarugenge', sector: 'Kimisagara' },
  { district: 'Nyarugenge', sector: 'Nyarugenge' },
  { district: 'Gasabo',     sector: 'Gisozi'     },
];

const FIRST_NAMES = [
  'Jean Claude','Marie Ange','Patrick','Grace','Emmanuel','Claudine','Alexis',
  'Esperance','Gilbert','Solange','Marie Claire','Jean Baptiste','Anastasia',
  'Callixte','Diane','Eric','Fabienne','Gregoire','Heline','Ildephonse',
  'Josephine','Kevin','Lucie','Michel','Nadine','Olivier','Patricia',
  'Quentine','Rose','Samuel'
];
const LAST_NAMES = [
  'Nkurunziza','Uwimana','Habimana','Mukamana','Bizimana','Uwineza',
  'Ndayisaba','Niyonzima','Nzeyimana','Mukeshimana','Munyawera','Ingabire',
  'Hagenimana','Niyonzima','Mukamana','Habimana','Uwimana','Nkurunziza',
  'Bizimana','Uwineza','Ndayisaba','Niyonzima','Nzeyimana','Mukeshimana',
  'Munyawera','Ingabire','Hagenimana','Kayitesi','Mukamana','Habimana'
];

function meterType(i) {
  if (i < KAM_COUNT) return 'kamstrup';
  if (i < KAM_COUNT + SUST_COUNT) return 'susteq';
  return 'eoi';
}

function meterSerial(i) {
  const t = meterType(i);
  if (t === 'kamstrup') return `KAM-${String(i + 1).padStart(3, '0')}`;
  if (t === 'susteq')   return `SUST-${String(i - KAM_COUNT + 1).padStart(3, '0')}`;
  return `EOI-${String(i - KAM_COUNT - SUST_COUNT + 1).padStart(3, '0')}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
sequelize.sync({ alter: true }).then(async () => {

  await Notification.destroy({ where: {} });
  await IssueReport.destroy({ where: {} });
  await Report.destroy({ where: {} });
  await Alert.destroy({ where: {} });
  await MeterReading.destroy({ where: {} });
  await Meter.destroy({ where: {} });
  await Household.destroy({ where: {} });
  await Staff.destroy({ where: {} });
  console.log('✓ Cleared previous seed data\n');

  // ── 1. Staff ─────────────────────────────────────────────────────────────
  console.log('\n── Staff ────────────────────────────────────────────────');
  const staffData = [
    { name: 'Admin WASAC',      email: 'admin@wasac.rw',         password: 'Admin@123',  role: 'admin',        phone: 0782000001 },
    { name: 'John Mugabo',      email: 'john.mugabo@wasac.rw',   password: 'Staff@123',  role: 'meter_reader', phone: 0782000002 },
    { name: 'Sarah Uwase',      email: 'sarah.uwase@wasac.rw',   password: 'Staff@123',  role: 'technician',   phone: 0782000003 },
    { name: 'Paul Habimana',    email: 'paul.habimana@wasac.rw', password: 'Staff@123',  role: 'billing',      phone: 0782000004 },
  ];
  const staffMembers = [];
  for (const s of staffData) {
    const [member] = await Staff.findOrCreate({ where: { email: s.email }, defaults: s });
    staffMembers.push(member);
    console.log(`✓ Staff   [${member.role.padEnd(12)}]  ${member.name}  —  ${member.email}`);
  }

  // ── 2. Households + 3. Meters ────────────────────────────────────────────
  console.log('\n── Households + Meters ─────────────────────────────────');
  const households = [];
  const meters     = [];
  const meterBases = [];

  for (let i = 0; i < TOTAL_METERS; i++) {
    const serial = meterSerial(i);
    const type   = meterType(i);
    const zone   = ZONES[i % ZONES.length];
    const fname  = FIRST_NAMES[i % FIRST_NAMES.length];
    const lname  = LAST_NAMES[i % LAST_NAMES.length];
    const phone  = `078${String(1000 + i + 1)}${String(i).padStart(3, '0')}`;

    const h = await Household.create({
      full_name:          `${fname} ${lname}`,
      phone:              phone,
      email:              `citizen${i + 1}@aquatrack.rw`,
      password:           'citizen123',
      district:           zone.district,
      sector:             zone.sector,
      address:            `KG ${(i + 1) * 12} St, ${zone.sector}`,
      meter_id:           serial,
      status:             'active',
      sms_low_balance:    true,
      sms_leak_detection: true,
      sms_monthly_bill:   true,
    });
    h.meter_type = type;
    households.push(h);

    let base;
    if (type === 'kamstrup') base = round(Math.random() * (2800.0 - 800.0) + 800.0, 3);
    else if (type === 'susteq') base = round(Math.random() * (40.0 - 8.0) + 8.0, 3);
    else base = round(Math.random() * (1500.0 - 500.0) + 500.0, 3);

    const m = await Meter.create({
      serial_number:     serial,
      household_id:      h.id,
      installation_date: '2024-06-15',
      last_reading:      base,
      last_reading_date: dateOnly(0),
      status:            'active',
    });
    meters.push({ meter: m, base: base, type: type });
    meterBases.push(base);
    console.log(`✓ ${type.padEnd(9)} ${serial}  →  ${h.full_name}  [${h.district}/${h.sector}]  base=${base} m³`);
  }

  // ── 4. Meter Readings ────────────────────────────────────────────────────
  console.log('\n── Meter Readings ───────────────────────────────────────');
  const READING_DAYS = [30, 27, 24, 21, 18, 15, 12, 9, 6, 3, 0];
  for (let i = 0; i < meters.length; i++) {
    let cumulative = meters[i].base;
    for (const offset of READING_DAYS) {
      let delta;
      const t = meters[i].type;
      if (t === 'kamstrup')      delta = rand(2.0, 7.0);
      else if (t === 'susteq')  delta = rand(0.10, 0.55);
      else                       delta = rand(1.5, 6.0);
      cumulative = parseFloat((cumulative + delta).toFixed(3));
      await MeterReading.create({
        meter_id:          meters[i].meter.id,
        household_id:      households[i].id,
        reading_value:     cumulative,
        consumption_delta: delta,
        reading_date:      daysAgo(offset),
        recorded_by:       staffMembers[1].id,
      });
    }
    await meters[i].meter.update({
      last_reading:      cumulative,
      last_reading_date: dateOnly(0),
    });
    console.log(`✓ Readings  ${meters[i].meter.serial_number}  (${READING_DAYS.length} readings over 30 days)`);
  }

  // ── 5. Alerts ────────────────────────────────────────────────────────────
  console.log('\n── Alerts ───────────────────────────────────────────────');
  const alertsData = [];
  const alertTemplates = [
    { type: 'leak',         severity: 'high',   msg: (s) => `Abnormal nighttime flow on ${s} — possible pipe leak.` },
    { type: 'high_usage',   severity: 'medium', msg: (s) => `Consumption spike on ${s} — 3× the monthly average.` },
    { type: 'high_usage',   severity: 'low',    msg: (s) => `${s} slightly above normal — monitor next cycle.` },
    { type: 'faulty_meter', severity: 'high',   msg: (s) => `${s} reported tamper / cover-open alarm.` },
    { type: 'faulty_meter', severity: 'high',   msg: (s) => `${s} offline. Immediate inspection required.` },
    { type: 'overdue_bill', severity: 'medium', msg: (_) => `Household has outstanding bills for 2 months.` },
  ];

  for (let i = 0; i < 25; i++) {
    const t = meterType(i);
    const tmpl = alertTemplates[i % alertTemplates.length];
    let type = tmpl.type;
    if (t === 'susteq' && type === 'leak') type = 'faulty_meter';
    if (t === 'eoi' && type === 'high_usage') type = 'faulty_meter';
    alertsData.push({
      household_id: households[i].id,
      meter_id:     meters[i].meter.id,
      type:         type,
      severity:     tmpl.severity,
      resolved:     i % 7 === 0,
      resolved_at:  i % 7 === 0 ? daysAgo(Math.floor(Math.random() * 10)) : null,
      message:      tmpl.msg(meters[i].meter.serial_number),
    });
  }
  for (const a of alertsData) {
    const alert = await Alert.create(a);
    const status = alert.resolved ? '✓ resolved' : '⚠ open    ';
    console.log(`✓ Alert  [${alert.type.padEnd(14)}] [${alert.severity.padEnd(6)}] [${status}]  ${alert.message.slice(0, 55)}`);
  }

  // ── 6. Billing Reports ────────────────────────────────────────────────────
  console.log('\n── Billing Reports ──────────────────────────────────────');
  for (let i = 0; i < TOTAL_METERS; i++) {
    const t = meterType(i);
    let consumption;
    if (t === 'kamstrup')      consumption = rand(6.0, 24.0);
    else if (t === 'susteq')  consumption = rand(2.0, 7.0);
    else                       consumption = rand(5.0, 20.0);
    const amount = parseFloat((consumption * 350).toFixed(2));
    const paid   = i % 5 !== 0;
    const r = await Report.create({
      household_id:  households[i].id,
      meter_id:      meters[i].meter.id,
      period_start:  dateOnly(30),
      period_end:    dateOnly(0),
      consumption,
      amount_due:    amount,
      paid,
      paid_at:       paid ? daysAgo(Math.floor(Math.random() * 10)) : null,
      generated_by:  staffMembers[3].id,
    });
    console.log(`✓ Report  ${households[i].full_name.padEnd(25)}  ${consumption} m³  ${amount} RWF  ${paid ? '✓ paid' : '✗ unpaid'}`);
  }

  // ── 7. Issue Reports ─────────────────────────────────────────────────────
  console.log('\n── Issue Reports ────────────────────────────────────────');
  const issuesData = [
    { issue_type: 'leak',         duration: 'Today',      description: 'Water leaking near KAM-001 meter enclosure.',                                    status: 'open',        assigned_to: null },
    { issue_type: 'other',        duration: '1 day',      description: 'SUST-005 tap 2 dispensing half-flow despite full credit.',                     status: 'in_progress', assigned_to: staffMembers[2].id },
    { issue_type: 'no_water',     duration: '3 days',     description: 'EOI-003 shows zero credit despite recent token entry.',                          status: 'open',        assigned_to: null },
    { issue_type: 'low_pressure', duration: '2 days',     description: 'Low pressure in KAM-007 sector during morning peak.',                           status: 'resolved',    assigned_to: staffMembers[2].id },
    { issue_type: 'leak',         duration: '1 week',     description: 'Persistent leak alarm on KAM-012 — possible pipe burst.',                       status: 'in_progress', assigned_to: staffMembers[1].id },
  ];
  for (const issue of issuesData) {
    const r = await IssueReport.create({
      household_id: households[0].id,
      sector:       ZONES[0].sector,
      district:     ZONES[0].district,
      ...issue
    });
    console.log(`✓ Issue  [${r.issue_type.padEnd(12)}] [${r.status.padEnd(11)}]  ${r.description.slice(0, 55)}`);
  }

  // ── 8. Notifications ─────────────────────────────────────────────────────
  console.log('\n── Notifications ────────────────────────────────────────');
  const notifData = [
    { recipient_type: 'staff',     recipient_id: staffMembers[0].id, type: 'issue',        title: 'New issue report',     body: 'Citizen in Kimironko reported leak near KAM-001.' },
    { recipient_type: 'staff',     recipient_id: staffMembers[1].id, type: 'system',       title: 'Reading due',          body: 'Monthly reading cycle starts for Gasabo.' },
    { recipient_type: 'staff',     recipient_id: staffMembers[2].id, type: 'issue',        title: 'Technician dispatch',  body: 'Investigate SUST-005 tap fault.' },
    { recipient_type: 'staff',     recipient_id: staffMembers[0].id, type: 'faulty_meter', title: 'Tamper alert',         body: 'EOI-003 reported cover-open alarm.' },
    { recipient_type: 'household', recipient_id: households[0].id,  type: 'leak',         title: 'Leak Alert',           body: `Abnormal nighttime flow on ${meters[0].meter.serial_number} — possible pipe leak.` },
    { recipient_type: 'household', recipient_id: households[15].id, type: 'high_usage',   title: 'Usage Anomaly',        body: `Susteq ${meters[15].meter.serial_number} high daytime dispensing.` },
    { recipient_type: 'household', recipient_id: households[24].id, type: 'faulty_meter', title: 'Faulty Meter',        body: `EoI ${meters[24].meter.serial_number} tamper alarm.` },
    { recipient_type: 'household', recipient_id: households[3].id,  type: 'high_usage',   title: 'Usage Anomaly',        body: `KAM-004 slightly above normal — monitor next cycle.`, read: true, read_at: daysAgo(1) },
    { recipient_type: 'household', recipient_id: households[8].id,  type: 'overdue_bill', title: 'Monthly Bill Ready',  body: 'Your bill is ready. Please pay before month end.' },
    { recipient_type: 'household', recipient_id: households[12].id, type: 'leak',         title: 'Leak Alert',           body: `Possible leak on ${meters[12].meter.serial_number} during polling.` },
  ];
  for (const n of notifData) {
    await Notification.create(n);
    console.log(`✓ Notification  [${n.recipient_type.padEnd(9)}]  ${n.title}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('✓ Demo seed complete — 30 meters (mixed fleet)');
  console.log(`  Staff          : ${staffMembers.length}  (1 admin, 3 staff)`);
  console.log(`  Households     : ${households.length}  (all active)`);
  console.log(`  Meters         : ${meters.length}  (${KAM_COUNT} Kamstrup + ${SUST_COUNT} Susteq + ${EOI_COUNT} EoI)`);
  console.log(`  Readings       : ${meters.length * READING_DAYS.length}  (${READING_DAYS.length} per meter over 30 days)`);
  console.log(`  Alerts         : ${alertsData.length}  (leak, high_usage, faulty_meter, overdue_bill)`);
  console.log(`  Billing Reports: ${households.length}  (~24 paid, ~6 unpaid)`);
  console.log(`  Issue Reports  : ${issuesData.length}`);
  console.log(`  Notifications  : ${notifData.length}  (staff + household)`);
  console.log('══════════════════════════════════════════════════════════');
  console.log('\n── Simulator endpoints ──────────────────────────────────');
  console.log(`  http://localhost:4000/health`);
  console.log(`  http://localhost:4000/kamstrup/api/readings  (${KAM_COUNT} meters)`);
  console.log(`  http://localhost:4000/susteq/api/readings    (${SUST_COUNT} units)`);
  console.log(`  http://localhost:4000/eoi/api/readings       (${EOI_COUNT} meters)`);
  console.log('══════════════════════════════════════════════════════════\n');

  process.exit();
  
}).catch(err => {
  console.error('✗ Seed failed:', err.message);
  if (err.errors) {
    err.errors.forEach(e => console.error('  →', e.message));
  }
  process.exit(1);
});
