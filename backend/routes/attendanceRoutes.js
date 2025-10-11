const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");

// ========================= LẤY LỊCH SỬ CHẤM CÔNG =========================
router.get("/", auth(["admin", "employee", "manager"]), async (req, res) => {
  try {
    let employees;
    let attendanceRecords;

    if (req.user.role === "admin") {
      // Admin xem tất cả nhân viên
      employees = await Employee.find().populate("userId", "username role");
      attendanceRecords = await Attendance.find().populate("userId", "username role");
    } else {
      // Nhân viên / quản lý chỉ xem bản thân
      employees = await Employee.find({ userId: req.user.id }).populate("userId", "username role");
      attendanceRecords = await Attendance.find({ userId: req.user.id }).populate("userId", "username role");
    }

    // Tạo map từ attendance theo userId
    const attendanceMap = new Map();
    attendanceRecords.forEach((a) => {
      const uid = a.userId?._id.toString();
      if (!attendanceMap.has(uid)) attendanceMap.set(uid, []);
      attendanceMap.get(uid).push(a);
    });

    // Duyệt qua tất cả nhân viên để đảm bảo ai cũng có record hiển thị
    const result = [];
    for (const emp of employees) {
      const uid = emp.userId?._id.toString();
      const records = attendanceMap.get(uid);

      if (records && records.length > 0) {
        // Nếu có bản ghi Attendance
        records.forEach((r) => {
          result.push({
            _id: r._id,
            userId: r.userId,
            date: r.date,
            checkIn: r.checkIn,
            lateMinutes: r.lateMinutes ?? 0,
            overtimeHours: r.overtimeHours ?? 0,
            totalDays: r.totalDays ?? 0,
          });
        });
      } else {
        // Nếu chưa có Attendance
        result.push({
          _id: uid + "-empty",
          userId: emp.userId,
          date: null,
          checkIn: null,
          lateMinutes: 0,
          overtimeHours: 0,
          totalDays: 0,
        });
      }
    }

    // Sắp xếp theo username để dễ nhìn
    result.sort((a, b) => (a.userId?.username || "").localeCompare(b.userId?.username || ""));
    res.json(result);
  } catch (err) {
    console.error("❌ Lỗi lấy chấm công:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================= CHECK-IN =========================
router.post("/check-in", auth(["admin", "employee", "manager"]), async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const existed = await Attendance.findOne({ userId: req.user.id, date: today });
    if (existed) return res.status(400).json({ error: "Hôm nay bạn đã Check-in rồi." });

    const now = new Date();
    const checkInHour = 7;
    const checkInMinute = 0;

    const diffMinutes = (now.getHours() * 60 + now.getMinutes()) - (checkInHour * 60 + checkInMinute);
    const lateMinutes = diffMinutes > 0 ? diffMinutes : 0;

    const record = new Attendance({
      userId: req.user.id,
      date: today,
      checkIn: now,
      totalDays: 1,
      lateMinutes: lateMinutes,
      status: "Present",
    });

    await record.save();
    res.json({ message: "✅ Check-in thành công", record });
  } catch (err) {
    console.error("❌ Lỗi check-in:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================= OVERTIME CHECK-IN =========================
router.post("/overtime", auth(["admin", "employee", "manager"]), async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const record = await Attendance.findOne({ userId: req.user.id, date: today });

    if (!record) return res.status(404).json({ error: "Bạn chưa Check-in hôm nay." });

    const now = new Date();
    const overtimeStart = 17 * 60;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (nowMinutes < overtimeStart) {
      return res.status(400).json({ error: "⏰ Tăng ca chỉ bắt đầu sau 17:00" });
    }

    record.overtimeStart = now;
    await record.save();

    res.json({ message: "✅ Bắt đầu tăng ca", record });
  } catch (err) {
    console.error("❌ Lỗi overtime check-in:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================= OVERTIME CHECK-OUT =========================
router.post("/overtime/checkout", auth(["admin", "employee", "manager"]), async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const record = await Attendance.findOne({ userId: req.user.id, date: today });

    if (!record || !record.overtimeStart)
      return res.status(404).json({ error: "Bạn chưa bắt đầu tăng ca." });

    const now = new Date();
    const overtimeHours = (now - record.overtimeStart) / 1000 / 60 / 60;
    record.overtimeHours += Math.round(overtimeHours * 100) / 100;

    await record.save();
    res.json({ message: "✅ Kết thúc tăng ca", record });
  } catch (err) {
    console.error("❌ Lỗi overtime checkout:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
