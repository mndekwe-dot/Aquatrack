const router = require('express').Router();
const Meter = require('./meter.model');
const { protect } = require('../../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const meters = await Meter.findAll();
    res.json(meters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const meter = await Meter.create(req.body);
    res.status(201).json(meter);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const meter = await Meter.findByPk(req.params.id);
    if (!meter) return res.status(404).json({ message: 'Meter not found' });
    res.json(meter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Record a new meter reading
router.patch('/:id/reading', protect, async (req, res) => {
  try {
    const meter = await Meter.findByPk(req.params.id);
    if (!meter) return res.status(404).json({ message: 'Meter not found' });
    const { reading, reading_date } = req.body;
    await meter.update({ last_reading: reading, last_reading_date: reading_date });
    res.json({ message: 'Reading recorded', meter });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const meter = await Meter.findByPk(req.params.id);
    if (!meter) return res.status(404).json({ message: 'Meter not found' });
    await meter.update(req.body);
    res.json(meter);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const meter = await Meter.findByPk(req.params.id);
    if (!meter) return res.status(404).json({ message: 'Meter not found' });
    await meter.destroy();
    res.json({ message: 'Meter deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
