const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/auth");
const Notification = require("./notification.model");

// GET /api/notifications/mine
router.get("/mine", protect, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { recipient_type: 'household', recipient_id: req.user.id },
      order: [["createdAt", "DESC"]],
      limit: 50,
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/notifications/read-all
router.put("/read-all", protect, async (req, res) => {
  try {
    await Notification.update(
        { read: true },
        { where: { recipient_type: 'household', recipient_id: req.user.id } }
    );
    res.json({ message: "All marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/notifications/:id/read
router.put("/:id/read", protect, async (req, res) => {
  try {
    await Notification.update(
        { read: true },
        { where: { id: req.params.id, recipient_type: 'household', recipient_id: req.user.id } }
    );
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;