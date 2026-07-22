const router = require('express').Router();
const Report = require('./report.model');
const IssueReport = require('./issue_report.model');
const { protect, staffOnly, citizenOnly } = require('../../middleware/auth');

// BILLING REPORTS
// WASAC staff — all billing reports
router.get('/billing', protect, staffOnly, async (req, res) => {
  try {
    const reports = await Report.findAll({ order: [['createdAt', 'DESC']] });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Citizen their own billing history (used by the History page)
router.get('/billing/mine', protect, citizenOnly, async (req, res) => {
  try {
    const reports = await Report.findAll({
      where: { household_id: req.user.id },
      order: [['period_start', 'DESC']],
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/billing', protect, staffOnly, async (req, res) => {
  try {
    const report = await Report.create({ ...req.body, generated_by: req.user.id });
    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/billing/:id/paid', protect, staffOnly, async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    await report.update({ paid: true, paid_at: new Date() });
    res.json({ message: 'Marked as paid', report });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// CITIZEN ISSUE REPORTS (leak / no water / low pressure / other)

// Citizen — submit a new issue report
router.post('/issues', protect, citizenOnly, async (req, res) => {
  try {
    const { issue_type, duration, description, sector, district } = req.body;
    if (!issue_type) return res.status(400).json({ message: 'issue_type is required' });

    const issue = await IssueReport.create({
      household_id: req.user.id,
      issue_type,
      duration,
      description,
      sector,
      district,
    });
    res.status(201).json(issue);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Citizen  their own submitted issues History page can show these too
router.get('/issues/mine', protect, citizenOnly, async (req, res) => {
  try {
    const issues = await IssueReport.findAll({
      where: { household_id: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// WASAC staff all citizen issue reports (the "Reports" wireframe page, with filters
router.get('/issues', protect, staffOnly, async (req, res) => {
  try {
    const { issue_type } = req.query;
    const where = issue_type ? { issue_type } : {};
    const issues = await IssueReport.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/issues/:id/status', protect, staffOnly, async (req, res) => {
  try {
    const issue = await IssueReport.findByPk(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue report not found' });
    const { status, assigned_to } = req.body;
    await issue.update({ status, assigned_to });
    res.json(issue);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
