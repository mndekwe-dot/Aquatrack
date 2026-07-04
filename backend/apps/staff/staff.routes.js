const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Staff = require('./staff.model');
const { protect, adminOnly } = require('../../middleware/auth');

// POST /api/staff/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const staff = await Staff.findOne({ where: { email } });
    if (!staff || !(await staff.validatePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: staff.id, role: staff.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ token, staff: { id: staff.id, name: staff.name, email: staff.email, role: staff.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/staff/register (admin only)
router.post('/register', protect, adminOnly, async (req, res) => {
  try {
    const staff = await Staff.create(req.body);
    res.status(201).json({ id: staff.id, name: staff.name, email: staff.email, role: staff.role });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/staff
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const staff = await Staff.findAll({ attributes: { exclude: ['password'] } });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/staff/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const staff = await Staff.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/staff/:id
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const staff = await Staff.findByPk(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    await staff.update(req.body);
    res.json({ message: 'Staff updated' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/staff/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const staff = await Staff.findByPk(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    await staff.destroy();
    res.json({ message: 'Staff deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
