const router = require('express').Router();
const Message = require('./message.model');
const { protect } = require('../../middleware/auth');

router.get('/inbox', protect, async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: { receiver_type: 'staff', receiver_id: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const message = await Message.create({
      ...req.body,
      sender_type: 'staff',
      sender_id: req.user.id,
    });
    res.status(201).json(message);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/:id/read', protect, async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    await message.update({ read: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
