const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");

const WORK_START_HOUR = 7;
const WORK_END_HOUR = 17;

function calcLateMinutes(checkIn) {
  if (!checkIn) return 0;
  const mins = checkIn.getHours() * 60 + checkIn.getMinutes();
  return Math.max(0, mins - WORK_START_HOUR * 60);
}

function calcWorkDay(checkIn, checkOut, override = null) {
  let totalDays = 0;
  let overtimeHours = 0;

  if (override !== null && !isNaN(override)) {
    totalDays = override;
  } else if (checkIn && checkOut) {
    const inM = checkIn.getHours() * 60 + checkIn.getMinutes();
    const outM = checkOut.getHours() * 60 + checkOut.getMinutes();

    if (outM >= WORK_END_HOUR * 60) totalDays = 1;
    else if (outM - inM >= 4 * 60) totalDays = 0.5;
  }

  if (checkOut) {
    const diff = checkOut.getHours() * 60 + checkOut.getMinutes() - WORK_END_HOUR * 60;
    overtimeHours = diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
  }

  return {
    totalDays: Math.min(1, Math.max(0, totalDays)),
    overtimeHours,
  };
}

router.get("/", auth(["admin", "manager", "employee"]), async (req, res) => {
  try {
    const { date } = req.query;
    const q = date ? { date } : {};

    let employees, attendanceRecords;

    if (["admin", "manager"].includes(req.user.role)) {
      employees = await Employee.find().populate("userId", "username role");
      attendanceRecords = await Attendance.find(q).populate("userId", "username role");
    } else {
      employees = await Employee.find({ userId: req.user.id }).populate("userId", "username role");
      attendanceRecords = await Attendance.find({ ...q, userId: req.user.id })
        .populate("userId", "username role");
    }

    if (date) {
      return res.json(
        attendanceRecords.sort((a, b) =>
          (a.userId?.username || "").localeCompare(b.userId?.username || "")
        )
      );
    }

    const map = new Map();
    attendanceRecords.forEach((r) => {
      const uid = r.userId?._id.toString();
      if (!map.has(uid)) map.set(uid, []);
      map.get(uid).push(r);
    });

    const result = employees.map((emp) => {
      const uid = emp.userId?._id.toString();
      const recs = map.get(uid);

      if (recs?.length)
        return recs.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

      return {
        _id: uid + "-empty",
        userId: emp.userId,
        date: null,
        checkIn: null,
        checkOut: null,
        lateMinutes: 0,
        overtimeHours: 0,
        totalDays: 0,
        status: "Absent",
      };
    });

    res.json(
      result.sort((a, b) =>
        (a.userId?.username || "").localeCompare(b.userId?.username || "")
      )
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/bulk-checkin", auth(["admin", "manager"]), async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0)
      return res.status(400).json({ error: "Chưa chọn nhân viên" });

    if (req.user.role === "manager") {
      const allowed = await Employee.find({ manager: req.user.id });
      const allowedIds = allowed.map((e) => e.userId?.toString());

      for (const uid of userIds) {
        if (!allowedIds.includes(uid)) {
          return res.status(403).json({ error: "Bạn không có quyền chấm nhân viên này" });
        }
      }
    }

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    const existed = await Attendance.find({
      userId: { $in: userIds },
      date: today,
    }).populate("userId", "username");

    if (existed.length > 0) {
      const names = existed.map((e) => e.userId.username).join(", ");
      return res.status(400).json({ error: `Nhân viên đã chấm hôm nay: ${names}` });
    }

    const lateMinutes = calcLateMinutes(now);
    const created = [];

    for (const uid of userIds) {
      created.push(
        await Attendance.create({
          userId: uid,
          date: today,
          checkIn: now,
          checkOut: null,
          lateMinutes,
          totalDays: 0,
          overtimeHours: 0,
          status: "Working",
        })
      );
    }

    res.json({ message: "✔ Chấm công thành công", records: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/manual/:id", auth(["admin", "manager"]), async (req, res) => {
  try {
    const rec = await Attendance.findById(req.params.id);
    if (!rec) return res.status(404).json({ error: "Không tìm thấy bản ghi" });

    if (req.user.role === "manager") {
      const owner = await Employee.findOne({ userId: rec.userId });
      if (!owner || owner.manager !== req.user.id)
        return res.status(403).json({ error: "Không có quyền sửa bản ghi này" });
    }

    let checkIn = rec.checkIn ? new Date(rec.checkIn) : null;
    let checkOut = rec.checkOut ? new Date(rec.checkOut) : null;
    let lateMinutes = rec.lateMinutes;
    const dateStr = rec.date;

    if (req.body.checkIn) {
      const newIn = new Date(req.body.checkIn);
      if (!isNaN(newIn)) {
        checkIn = newIn;
        lateMinutes = calcLateMinutes(checkIn);
      }
    }

    if (req.body.lateMinutes !== undefined) {
      lateMinutes = Number(req.body.lateMinutes);

      if (dateStr) {
        const base = new Date(dateStr);
        base.setHours(WORK_START_HOUR, 0, 0, 0);
        base.setMinutes(base.getMinutes() + lateMinutes);
        checkIn = base;
      }
    }

    if (req.body.checkOut) {
      const co = new Date(req.body.checkOut);
      if (!isNaN(co)) checkOut = co;
    }

    const { totalDays, overtimeHours } = calcWorkDay(checkIn, checkOut);

    rec.checkIn = checkIn;
    rec.checkOut = checkOut;
    rec.lateMinutes = lateMinutes;
    rec.overtimeHours = overtimeHours;
    rec.totalDays = totalDays;
    rec.status = totalDays === 0 ? "Absent" : checkIn && !checkOut ? "Working" : "Present";

    await rec.save();
    res.json({ message: "✔ Đã cập nhật", updated: rec });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/manual/:id", auth(["admin", "manager"]), async (req, res) => {
  try {
    const rec = await Attendance.findById(req.params.id);
    if (!rec) return res.status(404).json({ error: "Không tìm thấy bản ghi" });

    if (req.user.role === "manager") {
      const owner = await Employee.findOne({ userId: rec.userId });
      if (!owner || owner.manager !== req.user.id)
        return res.status(403).json({ error: "Không có quyền xoá bản ghi này" });
    }

    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ message: "🗑 Đã xoá bản ghi" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
