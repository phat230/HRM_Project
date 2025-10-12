const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");
const Employee = require("../models/Employee");

router.get("/", auth(["admin", "employee", "manager"]), async (req, res) => {
  try {
    let filter = {};

    if (req.user.role !== "admin") {
      const emp = await Employee.findOne({ userId: req.user.id });
      const dept = emp?.department || "general";
      filter = {
        $or: [
          { target: "all" },
          { target: "department", targetValue: dept },
          { target: "user", targetValue: req.user.id },
        ],
      };
    }

    const list = await Notification.find(filter)
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    console.error("❌ Lỗi lấy thông báo:", err);
    res.status(500).json({ error: err.message });
  }
});


router.post("/", auth(["admin"]), async (req, res) => {
  try {
    const { title, message, target, targetValue } = req.body;

    const noti = new Notification({
      title,
      message,
      target: target || "all",
      targetValue: targetValue || null,
      createdBy: req.user.id,
    });

    await noti.save();
    res.json({ message: "✅ Đã gửi thông báo", noti });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 🗑️ Xóa thông báo (admin)
 */
router.delete("/:id", auth(["admin"]), async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Không tìm thấy thông báo" });
    res.json({ message: "🗑️ Đã xóa thông báo" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
