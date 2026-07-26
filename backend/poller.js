const https = require('https');
const http  = require('http');
const { Op } = require('sequelize');
const Meter        = require('./apps/meters/meter.model');
const MeterReading = require('./apps/meters/meter_reading.model');
const Alert        = require('./apps/alerts/alert.model');
const Household    = require('./apps/households/household.model');
const Notification = require('./apps/notifications/notification.model');

const POLL_INTERVAL  = parseInt(process.env.POLL_INTERVAL_MS) || 5 * 60 * 1000;

function inferSimulatorUrl() {
  if (process.env.SIMULATOR_URL) return process.env.SIMULATOR_URL;
  const host = process.env.HOST || 'localhost';
  if (host.includes('railway') || host.includes('render') || host.includes('fly.dev')) {
    return 'https://aquatrack-meter-simulator-api.up.railway.app';
  }
  return 'http://localhost:4000';
}

const SIMULATOR_URL = inferSimulatorUrl();

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON from simulator')); }
      });
    }).on('error', reject);
  });
}

const NIGHT_START = 21;
const NIGHT_END   = 6;
const DEDUP_WINDOW_MS   = 30 * 60 * 1000;
const LEAK_NIGHT_DELTA  = 0.003;
const HIGH_USAGE_DELTA   = 0.06;

function isNight(isoString) {
  const h = new Date(isoString).getHours();
  return h >= NIGHT_START || h < NIGHT_END;
}

async function createAlert(meter, type, severity, message) {
  const now = Date.now();
  const recent = await Alert.findOne({
    where: {
      meter_id:  meter.id,
      type:      type,
      resolved:  false,
      createdAt: { [Op.gte]: new Date(now - DEDUP_WINDOW_MS) }
    }
  });
  if (!recent) {
    await Alert.create({
      household_id: meter.household_id,
      meter_id:     meter.id,
      type:         type,
      severity:     severity,
      message:      message
    });
    console.log(`[anomaly] ${type.toUpperCase()}  ${meter.serial_number}`);

    const notifType = type;
    const title = type === 'leak' ? 'Leak Alert' : 'Usage Anomaly';
    await Notification.create({
      recipient_type: 'household',
      recipient_id:   meter.household_id,
      type:           notifType,
      title:          title,
      body:           message,
      read:           false
    });
  }
}

async function detectFromSimulatorAlarms(meter, reading) {
  if (!reading.alarms || reading.alarms.length === 0) return;
  for (const alarm of reading.alarms) {
    if (alarm === 'leak') {
      await createAlert(meter, 'leak', 'high',
        `Simulator detected persistent leak on ${meter.serial_number}.`);
    } else if (alarm === 'high_usage') {
      await createAlert(meter, 'high_usage', 'medium',
        `Simulator detected high-usage alarm on ${meter.serial_number}.`);
    } else if (alarm === 'burst') {
      await createAlert(meter, 'high_usage', 'high',
        `Simulator detected burst/pipe-break on ${meter.serial_number}.`);
    } else if (alarm === 'reverse_flow') {
      await createAlert(meter, 'faulty_meter', 'medium',
        `Simulator detected reverse flow on ${meter.serial_number}.`);
    } else if (alarm === 'tamper') {
      await createAlert(meter, 'faulty_meter', 'high',
        `Simulator detected tamper attempt on ${meter.serial_number}.`);
    } else if (alarm === 'low_credit') {
      await createAlert(meter, 'overdue_bill', 'medium',
        `Low prepaid credit detected on ${meter.serial_number}.`);
    }
  }
}

async function detectFromDelta(meter, delta, timestamp) {
  if (delta <= 0) return;
  if (isNight(timestamp) && delta > LEAK_NIGHT_DELTA) {
    await createAlert(meter, 'leak', 'high',
      `Abnormal nighttime flow on ${meter.serial_number} — ${delta.toFixed(3)} m³ in 5 min, possible pipe leak.`);
  }
  if (delta > HIGH_USAGE_DELTA) {
    await createAlert(meter, 'high_usage', 'medium',
      `Consumption spike on ${meter.serial_number} — ${delta.toFixed(3)} m³ in 5 min.`);
  }
}

async function detectAnomalies(meter, delta, timestamp, reading) {
  await detectFromSimulatorAlarms(meter, reading);
  await detectFromDelta(meter, delta, timestamp);
}

async function pollKamstrup() {
  const readings = await fetchJSON(`${SIMULATOR_URL}/kamstrup/api/readings`);
  let saved = 0;

  for (const r of readings) {
    const meter = await Meter.findOne({ where: { serial_number: r.meter_serial } });
    if (!meter) continue;

    const prev = meter.last_reading || 0;
    const delta = parseFloat((r.reading_m3 - prev).toFixed(3));

    await MeterReading.create({
      meter_id:          meter.id,
      household_id:      meter.household_id,
      reading_value:     r.reading_m3,
      consumption_delta: delta > 0 ? delta : 0,
      reading_date:      new Date(r.timestamp),
    });

    await meter.update({
      last_reading:      r.reading_m3,
      last_reading_date: new Date(r.timestamp).toISOString().split('T')[0],
    });

    await detectAnomalies(meter, delta, r.timestamp, r);

    saved++;
  }

  console.log(`[poller] ${new Date().toISOString()} — saved ${saved}/${readings.length} Kamstrup readings`);
}

async function pollSusteq() {
  const readings = await fetchJSON(`${SIMULATOR_URL}/susteq/api/readings`);
  let saved = 0;

  for (const r of readings) {
    const meter = await Meter.findOne({ where: { serial_number: r.meter_serial } });
    if (!meter) continue;

    const prev = meter.last_reading || 0;
    const delta = parseFloat((r.reading_m3 - prev).toFixed(3));

    await MeterReading.create({
      meter_id:          meter.id,
      household_id:      meter.household_id,
      reading_value:     r.reading_m3,
      consumption_delta: delta > 0 ? delta : 0,
      reading_date:      new Date(r.timestamp),
    });

    await meter.update({
      last_reading:      r.reading_m3,
      last_reading_date: new Date(r.timestamp).toISOString().split('T')[0],
    });

    await detectAnomalies(meter, delta, r.timestamp, r);

    saved++;
  }

  console.log(`[poller] ${new Date().toISOString()} — saved ${saved}/${readings.length} Susteq readings`);
}

async function pollEoi() {
  const readings = await fetchJSON(`${SIMULATOR_URL}/eoi/api/readings`);
  let saved = 0;

  for (const r of readings) {
    const meter = await Meter.findOne({ where: { serial_number: r.meter_id } });
    if (!meter) continue;

    const prev = meter.last_reading || 0;
    const delta = parseFloat((r.reading_m3 - prev).toFixed(3));

    await MeterReading.create({
      meter_id:          meter.id,
      household_id:      meter.household_id,
      reading_value:     r.reading_m3,
      consumption_delta: delta > 0 ? delta : 0,
      reading_date:      new Date(r.timestamp),
    });

    await meter.update({
      last_reading:      r.reading_m3,
      last_reading_date: new Date(r.timestamp).toISOString().split('T')[0],
    });

    if (r.tamper || (r.alarms && r.alarms.length > 0)) {
      await createAlert(meter, 'faulty_meter', 'high',
        `EoI meter ${meter.serial_number} reported tamper/alarm: ${(r.tamper_type || r.alarms || []).join(', ')}.`);
    }

    if (r.valve_status === 'closed' && !r.alarms?.includes('recharge')) {
      await createAlert(meter, 'high_usage', 'medium',
        `EoI meter ${meter.serial_number} valve closed — zero credit or no flow detected.`);
    }

    saved++;
  }

  console.log(`[poller] ${new Date().toISOString()} — saved ${saved}/${readings.length} EoI readings`);
}

async function poll() {
  try {
    await pollKamstrup();
    await pollSusteq();
    await pollEoi();
  } catch (err) {
    console.error('[poller] error:', err.message);
  }
}

function startPoller() {
  console.log(`[poller] starting — interval ${POLL_INTERVAL / 1000}s — simulator: ${SIMULATOR_URL}`);
  poll(); // run once immediately on startup
  setInterval(poll, POLL_INTERVAL);
}

module.exports = { startPoller };
