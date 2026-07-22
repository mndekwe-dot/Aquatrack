const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const Household = require('./household.model');
const Meter = require('../meters/meter.model');
const MeterReading = require('../meters/meter_reading.model');
const Report = require('../reports/report.model');
const Alert = require('../alerts/alert.model');
const { protect, staffOnly, adminOnly, citizenOnly } = require('../../middleware/auth');

const PUBLIC_ATTRS = { exclude: ['password'] };

// POST /api/households/register
router.post('/register', async (req, res) => {
  try {
    const { full_name, phone, email, password, district, sector, meter_id } = req.body;

    if (!full_name || !phone || !password || !district || !sector || !meter_id) {
      return res.status(400).json({ message: 'full_name, phone, password, district, sector and meter_id are required' });
    }

    // Find or create the meter if citizen types their meter ID from their bill
    let meter = await Meter.findOne({ where: { serial_number: meter_id } });
    if (!meter) {
      meter = await Meter.create({
        serial_number: meter_id,
        household_id: null,
        status: 'active',
      });
    }
    const existingPhone = await Household.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(409).json({ message: 'An account with this phone number already exists' });
    }

    const existingMeterLink = await Household.findOne({ where: { meter_id } });
    if (existingMeterLink) {
      return res.status(409).json({ message: 'This meter is already linked to another account' });
    }

    const household = await Household.create({
      full_name, phone, email, password, district, sector, meter_id,
    });

    // keep the Meter record pointed at this household
    await meter.update({ household_id: household.id });

    const token = jwt.sign(
      { id: household.id, role: 'citizen' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: { id: household.id, full_name: household.full_name, phone: household.phone, role: 'citizen' },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/households/login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone number and password are required' });
    }

    const household = await Household.findOne({ where: { phone } });
    if (!household || !(await household.validatePassword(password))) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    const token = jwt.sign(
      { id: household.id, role: 'citizen' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: { id: household.id, full_name: household.full_name, phone: household.phone, role: 'citizen' },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/households/me
router.get('/me', protect, citizenOnly, async (req, res) => {
  try {
    const household = await Household.findByPk(req.user.id, { attributes: PUBLIC_ATTRS });
    if (!household) return res.status(404).json({ message: 'Account not found' });
    res.json(household);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/households/me — edit profile
router.put('/me', protect, citizenOnly, async (req, res) => {
  try {
    const household = await Household.findByPk(req.user.id);
    if (!household) return res.status(404).json({ message: 'Account not found' });

    const { full_name, email, sms_low_balance, sms_leak_detection, sms_monthly_bill, password } = req.body;
    await household.update({ full_name, email, sms_low_balance, sms_leak_detection, sms_monthly_bill, ...(password ? { password } : {}) });

    const clean = await Household.findByPk(req.user.id, { attributes: PUBLIC_ATTRS });
    res.json(clean);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/households/me/summary
router.get('/me/summary', protect, citizenOnly, async (req, res) => {
  try {
    const household = await Household.findByPk(req.user.id, { attributes: PUBLIC_ATTRS });
    if (!household) return res.status(404).json({ message: 'Account not found' });

    const meter = await Meter.findOne({ where: { serial_number: household.meter_id } });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const readingsThisMonth = meter
      ? await MeterReading.findAll({
          where: { meter_id: meter.id, reading_date: { [Op.gte]: startOfMonth } },
          order: [['reading_date', 'ASC']],
        })
      : [];

    const usedThisMonth = readingsThisMonth.reduce((sum, r) => sum + (r.consumption_delta || 0), 0);

    const lastReport = await Report.findOne({
      where: { household_id: household.id },
      order: [['createdAt', 'DESC']],
    });

    const activeAlerts = meter
      ? await Alert.count({ where: { meter_id: meter.id, resolved: false } })
      : 0;

    res.json({
      household: { full_name: household.full_name, meter_id: household.meter_id, district: household.district, sector: household.sector },
      meter_status: meter ? meter.status : 'unknown',
      used_this_month_liters: usedThisMonth,
      last_bill_amount: lastReport ? lastReport.amount_due : null,
      last_bill_paid: lastReport ? lastReport.paid : null,
      active_alerts: activeAlerts,
      daily_readings: readingsThisMonth.map(r => ({
        date: r.reading_date,
        liters: r.consumption_delta,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', protect, staffOnly, async (req, res) => {
  try {
    const households = await Household.findAll({ attributes: PUBLIC_ATTRS });
    res.json(households);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', protect, staffOnly, async (req, res) => {
  try {
    const household = await Household.findByPk(req.params.id, { attributes: PUBLIC_ATTRS });
    if (!household) return res.status(404).json({ message: 'Household not found' });
    res.json(household);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const household = await Household.findByPk(req.params.id);
    if (!household) return res.status(404).json({ message: 'Household not found' });
    await household.update(req.body);
    const clean = await Household.findByPk(req.params.id, { attributes: PUBLIC_ATTRS });
    res.json(clean);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const household = await Household.findByPk(req.params.id);
    if (!household) return res.status(404).json({ message: 'Household not found' });
    await household.destroy();
    res.json({ message: 'Household deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
