// backend/routes/reportRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Attendance = require("../models/Attendance");
const PerformanceReview = require("../models/PerformanceReview");
const WorkSchedule = require("../models/WorkSchedule");
const Document = require("../models/Document");
const Employee = require("../models/Employee");
const Leave = require("../models/Leave");

/**
 * 📊 Báo cáo cá nhân
 */
router.get("/me", auth(["employee", "manager", "admin"]), async (req, res) => {
  try {
    const userId = req.user.id;

    const emp = await Employee.findOne({ userId }).populate("userId", "username");
    if (!emp) return res.status(404).json({ error: "Không tìm thấy nhân viên" });

    const attendance = await Attendance.find({ userId });
    const totalHours = attendance.reduce((sum, a) => sum + (a.totalHours || 0), 0);

    const tasksCompleted = await WorkSchedule.countDocuments({ assignedTo: userId });

    const perf = await PerformanceReview.find({ userId });
    const avgScore =
      perf.length > 0
        ? perf.reduce((sum, p) => sum + (typeof p.score === "number" ? p.score : (p.communication + p.technical + p.attitude) / 3), 0) /
          perf.length
        : 0;

    // Nếu cần tracking download, thêm model log. Tạm thời = 0 cho an toàn.
    const docsDownloaded = 0;
    const totalLeaves = await Leave.countDocuments({ userId });

    res.json({
      username: emp.userId?.username || "",
      name: emp.name,
      department: emp.department,
      totalHours,
      tasksCompleted,
      avgScore: Number(avgScore.toFixed(2)),
      docsDownloaded,
      totalLeaves,
    });
  } catch (err) {
    console.error("❌ Lỗi tổng hợp báo cáo cá nhân:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 📊 Báo cáo tổng hợp toàn bộ nhân viên
 */
router.get("/", auth(["admin"]), async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("userId", "username") // ✅ chỉ lấy username
      .select("userId name department position");

    const data = await Promise.all(
      employees.map(async (emp) => {
        const attendance = await Attendance.find({ userId: emp.userId?._id });
        const totalHours = attendance.reduce((sum, a) => sum + (a.totalHours || 0), 0);

        const tasksCompleted = await WorkSchedule.countDocuments({ assignedTo: emp.userId?._id });

        const perf = await PerformanceReview.find({ userId: emp.userId?._id });
        const avgScore =
          perf.length > 0
            ? perf.reduce((sum, p) => sum + (typeof p.score === "number" ? p.score : (p.communication + p.technical + p.attitude) / 3), 0) /
              perf.length
            : 0;

        // Chưa có tracking download — giữ 0 để không vỡ FE
        const docsDownloaded = 0;
        const totalLeaves = await Leave.countDocuments({ userId: emp.userId?._id });

        return {
          username: emp.userId?.username || "", // ✅ chỉ trả username
          name: emp.name,
          department: emp.department,
          position: emp.position,
          totalHours,
          tasksCompleted,
          avgScore: Number(avgScore.toFixed(2)),
          docsDownloaded,
          totalLeaves,
        };
      })
    );

    res.json(data);
  } catch (err) {
    console.error("❌ Lỗi tổng hợp báo cáo toàn hệ thống:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
