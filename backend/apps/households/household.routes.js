const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Household = require('./household.model');
const { protect } = require('../../middleware/auth');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const household = await Household.findOne({ where: { owner_email: email } });
    if (!household || !(await household.validatePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { id: household.id, type: 'household' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({
      token,
      household: {
        id: household.id,
        owner_name: household.owner_name,
        owner_email: household.owner_email,
        zone: household.zone,
        status: household.status,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const households = await Household.findAll();
    res.json(households);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const household = await Household.create(req.body);
    res.status(201).json(household);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const household = await Household.findByPk(req.params.id);
    if (!household) return res.status(404).json({ message: 'Household not found' });
    res.json(household);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const household = await Household.findByPk(req.params.id);
    if (!household) return res.status(404).json({ message: 'Household not found' });
    await household.update(req.body);
    res.json(household);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
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
