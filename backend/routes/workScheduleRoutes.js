// backend/routes/workScheduleRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const WorkSchedule = require("../models/WorkSchedule");
const Employee = require("../models/Employee");

/**
 * 📅 Nhân viên xem lịch làm việc của mình hoặc phòng ban
 */
router.get("/", auth(["employee", "manager", "admin"]), async (req, res) => {
  try {
    let filter = {};

    if (req.user.role !== "admin") {
      const emp = await Employee.findOne({ userId: req.user.id });
      if (!emp) return res.status(404).json({ error: "Không tìm thấy nhân viên" });

      filter = {
        $or: [
          { department: emp.department },
          { assignedTo: req.user.id },
        ],
      };
    }

    const schedules = await WorkSchedule.find(filter)
      .populate("assignedTo", "username")
      .sort({ startDate: 1 });

    res.json(schedules);
  } catch (err) {
    console.error("❌ Lỗi lấy lịch làm việc:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 🧾 Admin thêm mới lịch làm việc
 */
router.post("/", auth(["admin"]), async (req, res) => {
  try {
    const { task, department, assignedTo, startDate, endDate } = req.body;
    if (!task || !startDate || !endDate)
      return res.status(400).json({ error: "Thiếu thông tin lịch làm việc" });

    const schedule = new WorkSchedule({
      task,
      department,
      assignedTo,
      startDate,
      endDate,
      createdAt: new Date(),
    });

    await schedule.save();
    res.json({ message: "✅ Đã thêm lịch làm việc", schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✏️ Admin chỉnh sửa lịch
 */
router.put("/:id", auth(["admin"]), async (req, res) => {
  try {
    const updated = await WorkSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Không tìm thấy lịch" });
    res.json({ message: "✅ Cập nhật lịch thành công", schedule: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 🗑️ Admin xóa lịch
 */
router.delete("/:id", auth(["admin"]), async (req, res) => {
  try {
    const deleted = await WorkSchedule.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Không tìm thấy lịch" });
    res.json({ message: "🗑️ Đã xóa lịch làm việc" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
