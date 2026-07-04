const router = require('express').Router();
const Notification = require('./notification.model');
const { protect } = require('../../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { recipient_type: 'staff', recipient_id: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notif = await Notification.findByPk(req.params.id);
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    await notif.update({ read: true, read_at: new Date() });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
