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

// ── Constants ─────────────────────────────────────────────────────────────────
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

const NAMES = [
  'Jean Claude Nkurunziza',
  'Marie Ange Uwimana',
  'Patrick Habimana',
  'Grace Mukamana',
  'Emmanuel Bizimana',
  'Claudine Uwineza',
  'Alexis Ndayisaba',
  'Esperance Niyonzima',
  'Gilbert Nzeyimana',
  'Solange Mukeshimana',
];

const PHONES = [
  '0781234001', '0782234002', '0783234003', '0784234004', '0785234005',
  '0786234006', '0787234007', '0788234008', '0789234009', '0780234010',
];

// ── Main ──────────────────────────────────────────────────────────────────────
sequelize.sync({ alter: true }).then(async () => {

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
  const [member] = await Staff.findOrCreate({
    where: { email: s.email },
    defaults: s,
  });
  staffMembers.push(member);
  console.log(`✓ Staff   [${member.role.padEnd(12)}]  ${member.name}  —  ${member.email}`);
}
  // ── 2. Households ────────────────────────────────────────────────────────
  console.log('\n── Households ───────────────────────────────────────────');
  const households = [];
  for (let i = 0; i < 10; i++) {
    const serial = `KAM-${String(i + 1).padStart(3, '0')}`;
    const zone   = ZONES[i];
    const h = await Household.create({
      full_name:         NAMES[i],
      phone:             PHONES[i],
      email:             `citizen${i + 1}@aquatrack.rw`,
      password:          'citizen123',
      district:          zone.district,
      sector:            zone.sector,
      address:           `KG ${(i + 1) * 12} St, ${zone.sector}`,
      meter_id:          serial,
      status:            i === 8 ? 'suspended' : 'active',
      sms_low_balance:   true,
      sms_leak_detection: true,
      sms_monthly_bill:  true,
    });
    households.push(h);
    console.log(`✓ Household  ${h.meter_id}  ${h.full_name}  [${h.district}/${h.sector}]  📞 ${h.phone}`);
  }

  // ── 3. Meters ────────────────────────────────────────────────────────────
  console.log('\n── Meters ───────────────────────────────────────────────');
  const meters = [];
  for (let i = 0; i < 10; i++) {
    const baseReading = parseFloat((800 + i * 150).toFixed(3));
    const m = await Meter.create({
      serial_number:     `KAM-${String(i + 1).padStart(3, '0')}`,
      household_id:      households[i].id,
      installation_date: '2025-01-15',
      last_reading:      baseReading,
      last_reading_date: dateOnly(0),
      status:            i === 7 ? 'faulty' : 'active',
    });
    meters.push({ meter: m, base: baseReading });
    console.log(`✓ Meter  ${m.serial_number}  →  ${households[i].full_name}  [${m.status}]`);
  }

  // ── 4. Meter Readings (30 days, every 3 days per meter) ──────────────────
  console.log('\n── Meter Readings ───────────────────────────────────────');
  const READING_DAYS = [30, 27, 24, 21, 18, 15, 12, 9, 6, 3, 0]; // 11 readings per meter
  for (let i = 0; i < meters.length; i++) {
    let cumulative = meters[i].base;
    for (const offset of READING_DAYS) {
      const delta = rand(1.5, 6.0);
      cumulative  = parseFloat((cumulative + delta).toFixed(3));
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
  const alertsData = [
    { household_id: households[0].id, meter_id: meters[0].meter.id, type: 'leak',         severity: 'high',   resolved: false, message: 'Abnormal flow detected at night on KAM-001 — possible pipe leak.' },
    { household_id: households[1].id, meter_id: meters[1].meter.id, type: 'high_usage',   severity: 'medium', resolved: false, message: 'KAM-002 consumption is 3× the monthly average. Investigate.' },
    { household_id: households[2].id, meter_id: meters[2].meter.id, type: 'leak',         severity: 'high',   resolved: true,  resolved_at: daysAgo(2), message: 'Leak confirmed and resolved on KAM-003.' },
    { household_id: households[3].id, meter_id: meters[3].meter.id, type: 'high_usage',   severity: 'low',    resolved: false, message: 'KAM-004 slightly above normal — monitor for next cycle.' },
    { household_id: households[4].id, meter_id: meters[4].meter.id, type: 'overdue_bill', severity: 'medium', resolved: false, message: 'Household 5 has an outstanding bill for 2 months.' },
    { household_id: households[5].id, meter_id: meters[5].meter.id, type: 'faulty_meter', severity: 'high',   resolved: false, message: 'KAM-006 sending inconsistent readings — meter may need replacement.' },
    { household_id: households[6].id, meter_id: meters[6].meter.id, type: 'high_usage',   severity: 'high',   resolved: true,  resolved_at: daysAgo(5), message: 'KAM-007 high usage confirmed as garden irrigation. Alert closed.' },
    { household_id: households[7].id, meter_id: meters[7].meter.id, type: 'faulty_meter', severity: 'high',   resolved: false, message: 'KAM-008 offline. Meter status: faulty. Technician dispatched.' },
    { household_id: households[9].id, meter_id: meters[9].meter.id, type: 'leak',         severity: 'medium', resolved: false, message: 'Low-level leak suspected on KAM-010 based on overnight flow.' },
  ];
  for (const a of alertsData) {
    const alert = await Alert.create(a);
    const status = alert.resolved ? '✓ resolved' : '⚠ open    ';
    console.log(`✓ Alert  [${alert.type.padEnd(14)}] [${alert.severity.padEnd(6)}] [${status}]  ${alert.message.slice(0, 50)}…`);
  }

  // ── 6. Billing Reports ────────────────────────────────────────────────────
  console.log('\n── Billing Reports ──────────────────────────────────────');
  for (let i = 0; i < 10; i++) {
    const consumption = rand(8, 25);
    const amount      = parseFloat((consumption * 350).toFixed(2)); // 350 RWF per m³
    const paid        = i < 6; // first 6 paid, last 4 unpaid
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

  // ── 7. Issue Reports (citizen-submitted) ─────────────────────────────────
  console.log('\n── Issue Reports ────────────────────────────────────────');
  const issuesData = [
    { household_id: households[0].id, sector: ZONES[0].sector, district: ZONES[0].district, issue_type: 'leak',         duration: 'Today',       description: 'Water is leaking from a pipe under my sink.',             status: 'open',        assigned_to: null },
    { household_id: households[1].id, sector: ZONES[1].sector, district: ZONES[1].district, issue_type: 'no_water',     duration: '2-3 days',    description: 'No water supply for 2 days. Tank is empty.',             status: 'in_progress', assigned_to: staffMembers[2].id },
    { household_id: households[2].id, sector: ZONES[2].sector, district: ZONES[2].district, issue_type: 'low_pressure', duration: 'Over a week', description: 'Pressure has been very low, especially in the morning.', status: 'resolved',    assigned_to: staffMembers[2].id },
    { household_id: households[3].id, sector: ZONES[3].sector, district: ZONES[3].district, issue_type: 'other',        duration: 'Today',       description: 'Meter display is not showing any reading.',              status: 'open',        assigned_to: null },
    { household_id: households[4].id, sector: ZONES[4].sector, district: ZONES[4].district, issue_type: 'leak',         duration: '2-3 days',    description: 'Wet spot in the yard near the meter box.',               status: 'in_progress', assigned_to: staffMembers[1].id },
  ];
  for (const issue of issuesData) {
    const r = await IssueReport.create(issue);
    console.log(`✓ Issue  [${r.issue_type.padEnd(12)}] [${r.status.padEnd(11)}]  ${r.description.slice(0, 50)}…`);
  }

  // ── 8. Notifications ─────────────────────────────────────────────────────
  console.log('\n── Notifications ────────────────────────────────────────');
  const notifData = [
    { recipient_type: 'staff',     recipient_id: staffMembers[0].id, title: 'New issue report',        body: 'A citizen in Kimironko reported a leak. Please assign a technician.',      read: false },
    { recipient_type: 'staff',     recipient_id: staffMembers[1].id, title: 'Reading due',              body: 'Monthly meter reading cycle starts today for Gasabo district.',           read: true,  read_at: daysAgo(1) },
    { recipient_type: 'staff',     recipient_id: staffMembers[2].id, title: 'Technician dispatch',      body: 'You have been assigned to investigate the leak on KAM-001.',             read: false },
    { recipient_type: 'staff',     recipient_id: staffMembers[3].id, title: 'Unpaid bills alert',       body: '4 households have outstanding bills this month.',                        read: false },
    { recipient_type: 'staff',     recipient_id: staffMembers[0].id, title: 'Faulty meter detected',    body: 'KAM-008 is offline. Immediate inspection required.',                    read: true,  read_at: daysAgo(3) },
    { recipient_type: 'household', recipient_id: households[0].id,   title: 'Leak alert on your meter', body: 'We detected abnormal flow on KAM-001 at night. Please check your pipes.', read: false },
    { recipient_type: 'household', recipient_id: households[1].id,   title: 'High usage warning',       body: 'Your water usage this month is unusually high. Review your consumption.', read: true,  read_at: daysAgo(2) },
    { recipient_type: 'household', recipient_id: households[2].id,   title: 'Issue report resolved',    body: 'Your reported low-pressure issue has been resolved by our technician.',   read: false },
    { recipient_type: 'household', recipient_id: households[4].id,   title: 'Bill generated',           body: 'Your monthly bill of 7,350 RWF is ready. Please pay before month end.',  read: false },
    { recipient_type: 'household', recipient_id: households[4].id,   title: 'Overdue payment',          body: 'Your account has 2 unpaid bills. Service may be suspended.',             read: false },
  ];
  for (const n of notifData) {
    await Notification.create(n);
    console.log(`✓ Notification  [${n.recipient_type.padEnd(9)}]  ${n.title}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('✓ Demo seed complete');
  console.log(`  Staff          : ${staffMembers.length}  (1 admin, 3 staff)`);
  console.log(`  Households     : ${households.length}  (8 active, 1 suspended, 1 linked to faulty meter)`);
  console.log(`  Meters         : ${meters.length}  (9 active, 1 faulty)`);
  console.log(`  Readings       : ${meters.length * READING_DAYS.length}  (${READING_DAYS.length} per meter over 30 days)`);
  console.log(`  Alerts         : ${alertsData.length}  (leak, high_usage, faulty_meter, overdue_bill)`);
  console.log(`  Billing Reports: ${households.length}  (6 paid, 4 unpaid)`);
  console.log(`  Issue Reports  : ${issuesData.length}  (open, in_progress, resolved)`);
  console.log(`  Notifications  : ${notifData.length}  (staff + household)`);
  console.log('══════════════════════════════════════════════════════════');
  console.log('\n── Login credentials ────────────────────────────────────');
  console.log('  WASAC Admin    admin@wasac.rw        / Admin@123');
  console.log('  WASAC Staff    john.mugabo@wasac.rw  / Staff@123');
  console.log('  Citizen        Phone: 0781234001     / citizen123');
  console.log('  Citizen        Phone: 0782234002     / citizen123');
  console.log('══════════════════════════════════════════════════════════\n');

  process.exit();
  
}).catch(err => {
  console.error('✗ Seed failed:', err.message);
  if (err.errors) {
    err.errors.forEach(e => console.error('  →', e.message));
  }
  process.exit(1);
});
