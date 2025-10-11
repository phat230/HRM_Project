const Salary = require("../models/Salary");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const mongoose = require("mongoose");
const moment = require("moment");

// 📌 Hàm tính phần trăm phạt dựa trên phút đi trễ
function calculatePenaltyRate(lateMinutes) {
  if (!lateMinutes || lateMinutes <= 0) return 0;
  if (lateMinutes <= 15) return 0.15;
  if (lateMinutes <= 60) return 0.3;
  return 0.5;
}

// 📌 Hàm tính tiền phạt thực tế
function calculatePenalty(lateMinutes, dailyRate) {
  return dailyRate * calculatePenaltyRate(lateMinutes);
}

// 📌 Admin: Lấy toàn bộ bảng lương theo tháng hiện tại
exports.getAllSalaries = async (req, res) => {
  try {
    const currentMonth = moment().format("YYYY-MM");
    const start = moment(currentMonth, "YYYY-MM").startOf("month").toDate();
    const end = moment(currentMonth, "YYYY-MM").endOf("month").toDate();

    const employees = await Employee.find().populate("userId", "username role");

    // 🧾 Lấy Attendance trong tháng
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
      attendance.filter(t => t._id).map(t => [t._id.toString(), t])
    );

    let salaries = await Salary.find({ month: currentMonth }).populate("userId", "username role");
    salaries = salaries.filter(s => s.userId);

    const result = [];

    for (const emp of employees) {
      if (!emp.userId) continue;

      const uid = emp.userId._id.toString();
      const stat = attendanceMap.get(uid) || { totalDays: 0, totalLateMinutes: 0, overtimeHours: 0 };

      // ✅ Giữ lại dailyRate và overtimeRate đã cập nhật trước đó
      let salary = await Salary.findOne({ userId: uid, month: currentMonth });
      if (!salary) {
        salary = new Salary({
          userId: uid,
          month: currentMonth,
          dailyRate: 300000,       // mặc định khi chưa có
          overtimeRate: 50000
        });
      }

      const dailyRate = salary.dailyRate;
      const overtimeRate = salary.overtimeRate;

      const penalty = calculatePenalty(stat.totalLateMinutes, dailyRate);
      const penaltyRate = calculatePenaltyRate(stat.totalLateMinutes);
      const overtimePay = stat.overtimeHours * overtimeRate;
      const amount = (stat.totalDays * dailyRate) - penalty + overtimePay;

      salary.penalty = penalty;
      salary.penaltyRate = penaltyRate;
      salary.overtimePay = overtimePay;
      salary.totalDays = stat.totalDays;
      salary.totalLateMinutes = stat.totalLateMinutes;
      salary.amount = amount;
      await salary.save();

      result.push({
        _id: salary._id,
        userId: emp.userId,
        name: emp.name,
        username: emp.userId?.username,
        totalDays: stat.totalDays,
        penalty,
        penaltyRate,
        overtimeHours: stat.overtimeHours,
        dailyRate,
        overtimeRate,
        amount,
        month: currentMonth,
      });

      console.log(`📊 [Salary][${emp.userId.username}] days=${stat.totalDays}, late=${stat.totalLateMinutes}, daily=${dailyRate}, overtime=${overtimeRate}, amount=${amount}`);
    }

    res.json(result);
  } catch (err) {
    console.error("❌ getAllSalaries error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 📌 Admin: Cập nhật lương theo ID
exports.updateSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { dailyRate, overtimeRate } = req.body;

    const salary = await Salary.findById(id).populate("userId", "username role");
    if (!salary) return res.status(404).json({ error: "Không tìm thấy bản ghi lương" });

    if (dailyRate) salary.dailyRate = Number(dailyRate);
    if (overtimeRate) salary.overtimeRate = Number(overtimeRate);

    // 👉 Chỉ tính trong tháng hiện tại
    const currentMonth = moment().format("YYYY-MM");
    const start = moment(currentMonth, "YYYY-MM").startOf("month").toDate();
    const end = moment(currentMonth, "YYYY-MM").endOf("month").toDate();

    const totals = await Attendance.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(salary.userId._id),
          checkIn: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: "$userId",
          totalDays: { $sum: { $ifNull: ["$totalDays", 0] } },
          totalLateMinutes: { $sum: { $ifNull: ["$lateMinutes", 0] } },
          totalOvertimeHours: { $sum: { $ifNull: ["$overtimeHours", 0] } }
        }
      }
    ]);

    const stat = totals.length ? totals[0] : { totalDays: 0, totalLateMinutes: 0, totalOvertimeHours: 0 };
    const penalty = calculatePenalty(stat.totalLateMinutes, salary.dailyRate);
    const overtimePay = stat.totalOvertimeHours * salary.overtimeRate;
    salary.amount = (stat.totalDays * salary.dailyRate) - penalty + overtimePay;
    salary.penalty = penalty;
    salary.penaltyRate = calculatePenaltyRate(stat.totalLateMinutes);
    salary.overtimePay = overtimePay;
    salary.totalDays = stat.totalDays;
    salary.totalLateMinutes = stat.totalLateMinutes;
    await salary.save();

    res.json({
      message: "✅ Cập nhật lương thành công",
      salary: {
        ...salary.toObject(),
        totalDays: stat.totalDays,
        penalty,
        overtimePay
      }
    });
  } catch (err) {
    console.error("❌ updateSalary error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 📌 User: Xem lương cá nhân
exports.getMySalary = async (req, res) => {
  try {
    let s = await Salary.findOne({ userId: req.user.id }).populate("userId", "username role");
    if (!s) {
      s = new Salary({
        userId: req.user.id,
        dailyRate: 300000,
        overtimeRate: 50000,
        amount: 0
      });
      await s.save();
      s = await s.populate("userId", "username role");
    }

    const currentMonth = moment().format("YYYY-MM");
    const start = moment(currentMonth, "YYYY-MM").startOf("month").toDate();
    const end = moment(currentMonth, "YYYY-MM").endOf("month").toDate();

    const totals = await Attendance.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          checkIn: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: "$userId",
          totalDays: { $sum: { $ifNull: ["$totalDays", 0] } },
          totalLateMinutes: { $sum: { $ifNull: ["$lateMinutes", 0] } },
          overtimeHours: { $sum: { $ifNull: ["$overtimeHours", 0] } }
        }
      }
    ]);

    const stat = totals.length ? totals[0] : { totalDays: 0, totalLateMinutes: 0, overtimeHours: 0 };
    const penalty = calculatePenalty(stat.totalLateMinutes, s.dailyRate);
    const overtimePay = stat.overtimeHours * s.overtimeRate;
    const amount = (stat.totalDays * s.dailyRate) - penalty + overtimePay;

    if (s.amount !== amount || s.penalty !== penalty || s.overtimePay !== overtimePay) {
      s.amount = amount;
      s.penalty = penalty;
      s.overtimePay = overtimePay;
      s.penaltyRate = calculatePenaltyRate(stat.totalLateMinutes);
      s.totalDays = stat.totalDays;
      s.totalLateMinutes = stat.totalLateMinutes;
      await s.save();
    }

    res.json([{
      _id: s._id,
      userId: s.userId,
      username: s.userId?.username,
      totalDays: stat.totalDays,
      overtimeHours: stat.overtimeHours,
      penalty,
      dailyRate: s.dailyRate,
      overtimeRate: s.overtimeRate,
      amount,
      date: s.date
    }]);
  } catch (err) {
    console.error("❌ getMySalary error:", err);
    res.status(500).json({ error: err.message });
  }
};
