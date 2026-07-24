const https = require('https');
const http  = require('http');
const Meter        = require('./apps/meters/meter.model');
const MeterReading = require('./apps/meters/meter_reading.model');

const SIMULATOR_URL  = process.env.SIMULATOR_URL || 'http://localhost:4000';
const POLL_INTERVAL  = parseInt(process.env.POLL_INTERVAL_MS) || 5 * 60 * 1000; // 5 minutes

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

    saved++;
  }

  console.log(`[poller] ${new Date().toISOString()} — saved ${saved}/${readings.length} Kamstrup readings`);
}

async function poll() {
  try {
    await pollKamstrup();
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
