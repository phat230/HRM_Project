// backend/routes/managerRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Employee = require("../models/Employee");

/**
 * 📌 Lấy danh sách nhân viên cùng phòng — dùng để thêm vào nhóm
 */
router.get("/department-employees", auth(["manager"]), async (req, res) => {
  try {
    const me = await Employee.findOne({ userId: req.user.id });

    if (!me) return res.status(404).json({ error: "Manager không có hồ sơ nhân viên" });

    const employees = await Employee.find({
      department: me.department,
      userId: { $ne: req.user.id }
    }).populate("userId", "username role");

    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 📌 Thêm nhân viên vào nhóm manager
 * Lưu thông tin manager cho từng employee
 */
router.post("/group/add", auth(["manager"]), async (req, res) => {
  try {
    const { employeeIds } = req.body;

    if (!Array.isArray(employeeIds) || employeeIds.length === 0)
      return res.status(400).json({ error: "Danh sách nhân viên không hợp lệ" });

    const me = await Employee.findOne({ userId: req.user.id });
    if (!me) return res.status(404).json({ error: "Không tìm thấy manager" });

    // Chỉ thêm nhân viên cùng phòng ban
    const updated = await Employee.updateMany(
      { _id: { $in: employeeIds }, department: me.department },
      { manager: req.user.id }
    );

    res.json({
      message: "Đã thêm nhân viên vào nhóm",
      modified: updated.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 📌 Lấy danh sách nhân viên Manager đang quản lý
 */
router.get("/group", auth(["manager"]), async (req, res) => {
  try {
    const list = await Employee.find({ manager: req.user.id })
      .populate("userId", "username role")
      .sort({ name: 1 });

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
