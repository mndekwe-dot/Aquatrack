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
    if (!staff.active) {
      return res.status(403).json({ message: 'This staff account has been deactivated' });
    }
    const token = jwt.sign(
      { id: staff.id, role: staff.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ token,
      must_change_password: staff.must_change_password,
      user: { id: staff.id, name: staff.name, email: staff.email, role: staff.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/staff/register
router.post('/register', protect, adminOnly, async (req, res) => {
  try {
    const staff = await Staff.create(req.body);
    res.status(201).json({ id: staff.id, name: staff.name, email: staff.email, role: staff.role });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/staff/me
router.get('/me', protect, async (req, res) => {
  try {
    if (req.user.role === 'citizen') return res.status(403).json({ message: 'Staff access required' });
    const staff = await Staff.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/staff (admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const staff = await Staff.findAll({ attributes: { exclude: ['password'] } });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const staff = await Staff.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

// POST /api/staff/change-password
router.post('/change-password', protect, async (req, res) => {
  try {
    if (req.user.role === 'citizen') {
      return res.status(403).json({ message: 'Staff access required' });
    }
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'current_password and new_password are required' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    const staff = await Staff.findByPk(req.user.id);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    const valid = await staff.validatePassword(current_password);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });

    await staff.update({ password: new_password, must_change_password: false });
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/staff/create
router.post('/create', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, phone, role, temp_password } = req.body;
    if (!name || !email || !temp_password) {
      return res.status(400).json({ message: 'name, email and temp_password are required' });
    }
    const existing = await Staff.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    const staff = await Staff.create({
      name, email, phone, role: role || 'meter_reader',
      password: temp_password,
      must_change_password: true,
      active: true,
    });
    res.status(201).json({
      message: `Staff account created. Share these credentials with ${name}: Email: ${email}, Temp Password: ${temp_password}. They will be required to change it on first login.`,
      staff: { id: staff.id, name: staff.name, email: staff.email, role: staff.role }
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
