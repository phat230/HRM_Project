const Salary = require("../models/Salary");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const mongoose = require("mongoose");

// 📌 Admin: Lấy danh sách lương
exports.getAllSalaries = async (req, res) => {
  try {
    const employees = await Employee.find().populate("userId", "username role");
    let salaries = await Salary.find().populate("userId", "username role");

    // 👉 đảm bảo mỗi employee có 1 salary record
    const salaryMap = new Map(salaries.map(s => [s.userId?._id.toString(), s]));
    for (const emp of employees) {
      if (emp.userId && !salaryMap.has(emp.userId._id.toString())) {
        const fresh = new Salary({
          userId: emp.userId._id,
          dailyRate: 300000,       // 💰 lương ngày mặc định
          overtimeRate: 50000,     // 💰 lương tăng ca mặc định
          amount: 0
        });
        await fresh.save();
        salaries.push(await fresh.populate("userId", "username role"));
      }
    }

    // 👉 Tổng ngày công, trễ, tăng ca
    const totals = await Attendance.aggregate([
      {
        $group: {
          _id: "$userId",
          totalDays: { $sum: { $ifNull: ["$totalDays", 0] } },
          totalLateMinutes: { $sum: { $ifNull: ["$lateMinutes", 0] } },
          totalOvertimeHours: { $sum: { $ifNull: ["$overtimeHours", 0] } }
        }
      }
    ]);
    const totalMap = new Map(totals.map(t => [t._id.toString(), t]));

    const result = salaries.map(s => {
      const userIdStr = s.userId?._id.toString();
      const emp = employees.find(e => e.userId?._id.toString() === userIdStr);
      const stat = totalMap.get(userIdStr) || { totalDays: 0, totalLateMinutes: 0, totalOvertimeHours: 0 };

      const totalDays = stat.totalDays;
      const totalLateMinutes = stat.totalLateMinutes;
      const totalOvertimeHours = stat.totalOvertimeHours;

      // 👉 Tính phạt đi trễ
      let penalty = 0;
      if (totalLateMinutes > 0) {
        // Nếu có trễ 1–15 phút → 15%
        const late15 = Math.min(totalLateMinutes, 15);
        if (late15 > 0) penalty += s.dailyRate * 0.15;

        // Nếu có trễ ≥ 60 phút → 50%
        if (totalLateMinutes >= 60) penalty += s.dailyRate * 0.5;
      }

      // 👉 Tăng ca
      const overtimePay = totalOvertimeHours * s.overtimeRate;

      // 👉 Tổng lương
      const amount = (totalDays * s.dailyRate) - penalty + overtimePay;

      return {
        _id: s._id,
        userId: s.userId,
        username: s.userId?.username,
        name: emp?.name || "",
        department: emp?.department || "",
        position: emp?.position || "",
        totalDays,
        dailyRate: s.dailyRate,
        penalty,
        overtimeHours: totalOvertimeHours,
        overtimePay,
        amount
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Admin: Cập nhật tiền lương ngày
exports.updateSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { dailyRate, overtimeRate } = req.body;

    const salary = await Salary.findById(id).populate("userId", "username role");
    if (!salary) return res.status(404).json({ error: "Không tìm thấy lương" });

    if (dailyRate) salary.dailyRate = Number(dailyRate);
    if (overtimeRate) salary.overtimeRate = Number(overtimeRate);

    // 👉 Tính lại tổng công & tăng ca
    const totals = await Attendance.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(salary.userId._id) } },
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

    // 👉 Phạt
    let penalty = 0;
    if (stat.totalLateMinutes > 0) {
      const late15 = Math.min(stat.totalLateMinutes, 15);
      if (late15 > 0) penalty += salary.dailyRate * 0.15;
      if (stat.totalLateMinutes >= 60) penalty += salary.dailyRate * 0.5;
    }

    const overtimePay = stat.totalOvertimeHours * salary.overtimeRate;
    salary.amount = (stat.totalDays * salary.dailyRate) - penalty + overtimePay;

    await salary.save();

    res.json({
      message: "✅ Cập nhật thành công",
      salary: { ...salary.toObject(), totalDays: stat.totalDays }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 User: Xem lương cá nhân
exports.getMySalary = async (req, res) => {
  try {
    let s = await Salary.findOne({ userId: req.user.id }).populate("userId", "username role");
    if (!s) {
      s = new Salary({ userId: req.user.id, dailyRate: 300000, overtimeRate: 50000, amount: 0 });
      await s.save();
      s = await s.populate("userId", "username role");
    }

    const totals = await Attendance.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
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

    // 👉 Phạt
    let penalty = 0;
    if (stat.totalLateMinutes > 0) {
      const late15 = Math.min(stat.totalLateMinutes, 15);
      if (late15 > 0) penalty += s.dailyRate * 0.15;
      if (stat.totalLateMinutes >= 60) penalty += s.dailyRate * 0.5;
    }

    const overtimePay = stat.totalOvertimeHours * s.overtimeRate;
    const amount = (stat.totalDays * s.dailyRate) - penalty + overtimePay;

    res.json([{
      _id: s._id,
      userId: s.userId,
      username: s.userId?.username,
      totalDays: stat.totalDays,
      penalty,
      overtimeHours: stat.totalOvertimeHours,
      overtimePay,
      dailyRate: s.dailyRate,
      amount,
      date: s.date
    }]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
