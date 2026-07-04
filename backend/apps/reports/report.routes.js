const router = require('express').Router();
const Report = require('./report.model');
const { protect } = require('../../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const reports = await Report.findAll({ order: [['createdAt', 'DESC']] });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const report = await Report.create({ ...req.body, generated_by: req.user.id });
    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/paid', protect, async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    await report.update({ paid: true, paid_at: new Date() });
    res.json({ message: 'Marked as paid', report });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
