// controllers/salaryController.js
const Salary = require("../models/Salary");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const mongoose = require("mongoose");
const moment = require("moment");

// =============== 📘 HÀM HỖ TRỢ =================

// 👉 Tính tiền phạt dựa theo tổng phút đi trễ
function calculateLatePenalty(totalLateMinutes) {
  if (!totalLateMinutes || totalLateMinutes <= 0) return 0;
  if (totalLateMinutes >= 240) return "halfday"; // đi muộn >= 4h
  if (totalLateMinutes >= 60) return 100000;
  if (totalLateMinutes >= 30) return 50000;
  if (totalLateMinutes >= 15) return 30000;
  return 0;
}

// 👉 Tính số ngày làm việc trong tháng (trừ Chủ nhật)
function getWorkingDaysInMonth(year, monthIndex) {
  const date = new Date(year, monthIndex, 1);
  let count = 0;
  while (date.getMonth() === monthIndex) {
    const day = date.getDay();
    if (day !== 0) count++;
    date.setDate(date.getDate() + 1);
  }
  return count;
}

// ================= 📌 ADMIN: LẤY TOÀN BỘ BẢNG LƯƠNG =================
exports.getAllSalaries = async (req, res) => {
  try {
    const currentMonth = req.query.month || moment().format("YYYY-MM");
    const start = moment(currentMonth, "YYYY-MM").startOf("month").toDate();
    const end = moment(currentMonth, "YYYY-MM").endOf("month").toDate();

    const year = moment(currentMonth, "YYYY-MM").year();
    const monthIndex = moment(currentMonth, "YYYY-MM").month();
    const workingDays = getWorkingDaysInMonth(year, monthIndex);

    const employees = await Employee.find().populate("userId", "username role");

    // Tổng hợp Attendance trong tháng
    const attendance = await Attendance.aggregate([
      { $match: { checkIn: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: "$userId",
          totalDays: { $sum: { $ifNull: ["$totalDays", 0] } },
          totalLateMinutes: { $sum: { $ifNull: ["$lateMinutes", 0] } },
          overtimeHours: { $sum: { $ifNull: ["$overtimeHours", 0] } },
        },
      },
    ]);

    const attendanceMap = new Map(
      attendance.filter((t) => t._id).map((t) => [t._id.toString(), t])
    );

    const result = [];

    for (const emp of employees) {
      if (!emp.userId) continue;
      const uid = emp.userId._id.toString();

      const stat =
        attendanceMap.get(uid) || {
          totalDays: 0,
          totalLateMinutes: 0,
          overtimeHours: 0,
        };

      // lấy Salary hiện tại hoặc tạo mới
      let salary = await Salary.findOne({ userId: uid, month: currentMonth });
      if (!salary) {
        salary = new Salary({
          userId: uid,
          month: currentMonth,
          dailyRate: 300000,
          overtimeRate: 50000,
        });
      }

      const latePenalty = calculateLatePenalty(stat.totalLateMinutes);
      let penalty = 0;
      let finalDays = stat.totalDays;

      if (latePenalty === "halfday") {
        finalDays = Math.max(0, stat.totalDays - 1);
      } else {
        penalty = latePenalty;
      }

      const overtimePay = stat.overtimeHours * salary.overtimeRate;
      const basePay = finalDays * salary.dailyRate;
      const amount = basePay - penalty + overtimePay;

      salary.totalDays = finalDays;
      salary.totalLateMinutes = stat.totalLateMinutes;
      salary.penalty = penalty;
      salary.overtimePay = overtimePay;
      salary.amount = amount;
      await salary.save();

      result.push({
        _id: salary._id,
        userId: emp.userId,
        name: emp.name,
        username: emp.userId.username,
        department: emp.department,
        totalDays: finalDays,
        totalLateMinutes: stat.totalLateMinutes,
        penalty,
        overtimeHours: stat.overtimeHours,
        dailyRate: salary.dailyRate,
        overtimeRate: salary.overtimeRate,
        overtimePay,
        amount,
        workingDays,
        month: currentMonth,
      });
    }

    res.json(result);
  } catch (err) {
    console.error("❌ getAllSalaries error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ================= 📌 ADMIN: CẬP NHẬT LƯƠNG =================
exports.updateSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { dailyRate, overtimeRate, penalty, totalDays } = req.body;

    const salary = await Salary.findById(id).populate("userId", "username role");
    if (!salary) return res.status(404).json({ error: "Không tìm thấy bản ghi lương" });

    if (dailyRate) salary.dailyRate = Number(dailyRate);
    if (overtimeRate) salary.overtimeRate = Number(overtimeRate);
    if (penalty) salary.penalty = Number(penalty);
    if (typeof totalDays !== "undefined") salary.totalDays = Number(totalDays);

    salary.amount =
      salary.totalDays * salary.dailyRate - salary.penalty + salary.overtimePay;

    await salary.save();
    res.json({ message: "✅ Cập nhật lương thành công", salary });
  } catch (err) {
    console.error("❌ updateSalary error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ================= 📌 USER: XEM LƯƠNG CỦA MÌNH =================
exports.getMySalary = async (req, res) => {
  try {
    // ✅ đọc tháng từ query, nếu không có thì mặc định là tháng hiện tại
    const currentMonth = req.query.month || moment().format("YYYY-MM");
    const start = moment(currentMonth, "YYYY-MM").startOf("month").toDate();
    const end = moment(currentMonth, "YYYY-MM").endOf("month").toDate();

    let s = await Salary.findOne({
      userId: req.user.id,
      month: currentMonth,
    }).populate("userId", "username role");

    if (!s) {
      s = new Salary({
        userId: req.user.id,
        month: currentMonth,
        dailyRate: 300000,
        overtimeRate: 50000,
      });
      await s.save();
      s = await s.populate("userId", "username role");
    }

    const totals = await Attendance.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          checkIn: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$userId",
          totalDays: { $sum: { $ifNull: ["$totalDays", 0] } },
          totalLateMinutes: { $sum: { $ifNull: ["$lateMinutes", 0] } },
          overtimeHours: { $sum: { $ifNull: ["$overtimeHours", 0] } },
        },
      },
    ]);

    const stat =
      totals.length > 0
        ? totals[0]
        : { totalDays: 0, totalLateMinutes: 0, overtimeHours: 0 };

    const latePenalty = calculateLatePenalty(stat.totalLateMinutes);
    let penalty = 0;
    let finalDays = stat.totalDays;

    if (latePenalty === "halfday") {
      finalDays = Math.max(0, stat.totalDays - 1);
    } else {
      penalty = latePenalty;
    }

    const overtimePay = stat.overtimeHours * s.overtimeRate;
    const basePay = finalDays * s.dailyRate;
    const amount = basePay - penalty + overtimePay;

    s.totalDays = finalDays;
    s.totalLateMinutes = stat.totalLateMinutes;
    s.penalty = penalty;
    s.overtimePay = overtimePay;
    s.amount = amount;
    s.month = currentMonth;
    await s.save();

    res.json([{ ...s.toObject(), month: currentMonth }]);
  } catch (err) {
    console.error("❌ getMySalary error:", err);
    res.status(500).json({ error: err.message });
  }
};
