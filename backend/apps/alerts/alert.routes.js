const router = require('express').Router();
const Alert = require('./alert.model');
const Meter = require('../meters/meter.model');
const { protect, staffOnly, citizenOnly } = require('../../middleware/auth');

// WASAC staff
router.get('/', protect, staffOnly, async (req, res) => {
  try {
    const alerts = await Alert.findAll({ order: [['createdAt', 'DESC']] });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Citizen only their own alerts used by the citizen dashboard "low balance / leak" banners
router.get('/mine', protect, citizenOnly, async (req, res) => {
  try {
    const meter = await Meter.findOne({ where: { household_id: req.user.id } });
    if (!meter) return res.json([]);
    const alerts = await Alert.findAll({
      where: { meter_id: meter.id, resolved: false },
      order: [['createdAt', 'DESC']],
    });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, staffOnly, async (req, res) => {
  try {
    const alert = await Alert.create(req.body);
    res.status(201).json(alert);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/:id/resolve', protect, staffOnly, async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    await alert.update({ resolved: true, resolved_at: new Date() });
    res.json({ message: 'Alert resolved', alert });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, staffOnly, async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    await alert.destroy();
    res.json({ message: 'Alert deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
