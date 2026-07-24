require('dotenv').config();
const sequelize    = require('./config/database');
require('./models');
const Household    = require('./apps/households/household.model');
const Meter        = require('./apps/meters/meter.model');
const MeterReading = require('./apps/meters/meter_reading.model');

const ZONES        = ['Gasabo', 'Kicukiro', 'Nyarugenge'];
const TOTAL        = 10;
const READINGS_PER_METER = 4;          // days: 6, 4, 2, 0 days ago
const DAYS_AGO     = [6, 4, 2, 0];

sequelize.sync({ alter: true }).then(async () => {

  // ── Households ────────────────────────────────────────────────
  const households = [];
  for (let i = 1; i <= TOTAL; i++) {
    const h = await Household.create({
      owner_name:  `Household User ${i}`,
      owner_email: `household${i}@aquatrack.rw`,
      password:    'citizen123',
      address:     `KG ${i * 10} St, Kigali`,
      zone:        ZONES[(i - 1) % ZONES.length],
      status:      'active',
    });
    households.push(h);
    console.log(`✓ Household  ${h.id}  ${h.owner_name}  [${h.zone}]`);
  }

  // ── Meters (one per household) ────────────────────────────────
  const meters = [];
  for (let i = 0; i < TOTAL; i++) {
    const baseReading = parseFloat((800 + i * 150).toFixed(3));
    const m = await Meter.create({
      serial_number:     `KAM-${String(i + 1).padStart(3, '0')}`,
      household_id:      households[i].id,
      installation_date: '2025-01-15',
      last_reading:      baseReading,
      last_reading_date: new Date().toISOString().split('T')[0],
      status:            'active',
    });
    meters.push({ meter: m, base: baseReading });
    console.log(`✓ Meter      ${m.serial_number}  →  household ${households[i].id}`);
  }

  // ── Readings (READINGS_PER_METER per meter) ───────────────────
  const now = new Date();
  for (let i = 0; i < meters.length; i++) {
    let cumulative = meters[i].base;
    for (const offset of DAYS_AGO) {
      const delta    = parseFloat((Math.random() * 2.5 + 0.5).toFixed(3));
      cumulative     = parseFloat((cumulative + delta).toFixed(3));
      const date     = new Date(now);
      date.setDate(date.getDate() - offset);
      await MeterReading.create({
        meter_id:          meters[i].meter.id,
        household_id:      households[i].id,
        reading_value:     cumulative,
        consumption_delta: delta,
        reading_date:      date,
      });
    }
    console.log(`✓ Readings   ${meters[i].meter.serial_number}  (${READINGS_PER_METER} readings)`);
  }

  const total = meters.length * READINGS_PER_METER;
  console.log('\n─────────────────────────────────');
  console.log('✓ Seed complete');
  console.log(`  Households : ${households.length}`);
  console.log(`  Meters     : ${meters.length}`);
  console.log(`  Readings   : ${total}`);
  console.log('─────────────────────────────────');
  console.log('\nVerify in psql:');
  console.log('  SELECT COUNT(*) FROM "Households";');
  console.log('  SELECT COUNT(*) FROM "Meters";');
  console.log('  SELECT COUNT(*) FROM "MeterReadings";');
  process.exit();

}).catch(err => {
  console.error('✗ Seed failed:', err.message);
  process.exit(1);
});
