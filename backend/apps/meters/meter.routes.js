const router = require('express').Router();
const Meter = require('./meter.model');
const MeterReading = require('./meter_reading.model');
const { protect, staffOnly } = require('../../middleware/auth');

router.get('/', protect, staffOnly, async (req, res) => {
  try {
    const meters = await Meter.findAll();
    res.json(meters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, staffOnly, async (req, res) => {
  try {
    const meter = await Meter.create(req.body);
    res.status(201).json(meter);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/:id', protect, staffOnly, async (req, res) => {
  try {
    const meter = await Meter.findByPk(req.params.id);
    if (!meter) return res.status(404).json({ message: 'Meter not found' });
    res.json(meter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Record a new meter reading
router.patch('/:id/reading', protect, staffOnly, async (req, res) => {
  try {
    const meter = await Meter.findByPk(req.params.id);
    if (!meter) return res.status(404).json({ message: 'Meter not found' });

    const { reading_value, reading_date } = req.body;
    const delta = reading_value - (meter.last_reading || 0);

    await MeterReading.create({
      meter_id: meter.id,
      household_id: meter.household_id,
      reading_value,
      consumption_delta: delta,
      reading_date: reading_date || new Date(),
      recorded_by: req.user.id,
    });

    await meter.update({ last_reading: reading_value, last_reading_date: reading_date || new Date() });

    res.json({ message: 'Reading recorded', meter, consumption_delta: delta });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', protect, staffOnly, async (req, res) => {
  try {
    const meter = await Meter.findByPk(req.params.id);
    if (!meter) return res.status(404).json({ message: 'Meter not found' });
    await meter.update(req.body);
    res.json(meter);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, staffOnly, async (req, res) => {
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
