const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");

// ========================= LẤY LỊCH SỬ CHẤM CÔNG =========================
router.get("/", auth(["admin", "employee", "manager"]), async (req, res) => {
  try {
    let employees, attendanceRecords;

    if (req.user.role === "admin") {
      // Admin xem tất cả nhân viên
      employees = await Employee.find().populate("userId", "username role");
      attendanceRecords = await Attendance.find().populate("userId", "username role");
    } else {
      // Nhân viên / quản lý chỉ xem bản thân
      employees = await Employee.find({ userId: req.user.id }).populate("userId", "username role");
      attendanceRecords = await Attendance.find({ userId: req.user.id }).populate("userId", "username role");
    }

    // Map từ userId → danh sách bản ghi Attendance
    const attendanceMap = new Map();
    attendanceRecords.forEach((a) => {
      const uid = a.userId?._id.toString();
      if (!attendanceMap.has(uid)) attendanceMap.set(uid, []);
      attendanceMap.get(uid).push(a);
    });

    const result = [];
    for (const emp of employees) {
      const uid = emp.userId?._id.toString();
      const records = attendanceMap.get(uid);

      if (records && records.length > 0) {
        records.forEach((r) => {
          result.push({
            _id: r._id,
            userId: r.userId,
            date: r.date,
            checkIn: r.checkIn,
            checkOut: r.checkOut,
            lateMinutes: r.lateMinutes ?? 0,
            overtimeHours: r.overtimeHours ?? 0,
            totalDays: r.totalDays ?? 0,
          });
        });
      } else {
        result.push({
          _id: uid + "-empty",
          userId: emp.userId,
          date: null,
          checkIn: null,
          checkOut: null,
          lateMinutes: 0,
          overtimeHours: 0,
          totalDays: 0,
        });
      }
    }

    // sắp xếp theo username
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
    let record = await Attendance.findOne({ userId: req.user.id, date: today });

    if (record?.checkIn) return res.status(400).json({ error: "Hôm nay bạn đã Check-in rồi." });

    const now = new Date();
    const startHour = 7; // Giờ làm chuẩn: 7:00 sáng
    const startMinute = 0;
    const endHour = 17; // ✅ Giờ ra mặc định 17:00 chiều

    // tính phút đi trễ
    const diffMinutes = (now.getHours() * 60 + now.getMinutes()) - (startHour * 60 + startMinute);
    const lateMinutes = diffMinutes > 0 ? diffMinutes : 0;

    // tạo bản ghi mới
    const checkOutDefault = new Date();
    checkOutDefault.setHours(endHour, 0, 0, 0);

    record = new Attendance({
      userId: req.user.id,
      date: today,
      checkIn: now,
      checkOut: checkOutDefault, // ✅ giờ ra mặc định 17:00
      totalDays: 1,
      lateMinutes,
      overtimeHours: 0,
      status: "Present",
    });

    await record.save();
    res.json({ message: "✅ Check-in thành công (Giờ ra mặc định 17:00)", record });
  } catch (err) {
    console.error("❌ Lỗi check-in:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================= CHECK-OUT (bổ sung cho báo cáo, tùy chọn) =========================
router.post("/check-out", auth(["admin", "employee", "manager"]), async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const record = await Attendance.findOne({ userId: req.user.id, date: today });

    if (!record || !record.checkIn) return res.status(400).json({ error: "Bạn chưa Check-in hôm nay." });
    if (record.checkOut && record.checkOut.getHours() === 17)
      return res.status(400).json({ error: "Giờ ra mặc định đã là 17:00." });

    record.checkOut = new Date();
    const ms = record.checkOut - record.checkIn;
    record.totalHours = Math.max(0, Math.round((ms / 36e5) * 100) / 100);

    await record.save();
    res.json({ message: "⏹ Check-out thủ công thành công", record });
  } catch (err) {
    console.error("❌ Lỗi check-out:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================= BẮT ĐẦU TĂNG CA =========================
router.post("/overtime", auth(["admin", "employee", "manager"]), async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const record = await Attendance.findOne({ userId: req.user.id, date: today });

    if (!record || !record.checkIn)
      return res.status(404).json({ error: "Bạn chưa Check-in hôm nay." });

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const overtimeStart = 17 * 60;
    if (nowMinutes < overtimeStart)
      return res.status(400).json({ error: "⏰ Tăng ca chỉ bắt đầu sau 17:00." });

    record.overtimeStart = now;
    await record.save();

    res.json({ message: "✅ Bắt đầu tăng ca", record });
  } catch (err) {
    console.error("❌ Lỗi overtime check-in:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================= KẾT THÚC TĂNG CA =========================
router.post("/overtime/checkout", auth(["admin", "employee", "manager"]), async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const record = await Attendance.findOne({ userId: req.user.id, date: today });

    if (!record || !record.overtimeStart)
      return res.status(404).json({ error: "Bạn chưa bắt đầu tăng ca." });

    record.overtimeEnd = new Date();
    const overtimeHours = Math.max(0, (record.overtimeEnd - record.overtimeStart) / 36e5);
    record.overtimeHours = Math.round(overtimeHours * 100) / 100;

    await record.save();
    res.json({ message: "✅ Kết thúc tăng ca", record });
  } catch (err) {
    console.error("❌ Lỗi overtime checkout:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
