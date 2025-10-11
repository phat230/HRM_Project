const User = require("../models/User");
const Employee = require("../models/Employee");
const Leave = require("../models/Leave");
const Salary = require("../models/Salary");

exports.getAllEmployees = async (req, res) => {
  const employees = await Employee.find().populate("userId", "username role");
  res.json(employees);
};

exports.addEmployee = async (req, res) => {
  try {
    const { username, password, name, department, position, role } = req.body;
    const newUser = new User({ username, password, role });
    await newUser.save();

    const newEmployee = new Employee({ userId: newUser._id, name, department, position });
    await newEmployee.save();

    res.json({ message: "Thêm nhân viên thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLeaveRequests = async (req, res) => {
  const leaves = await Leave.find().populate("userId", "username");
  res.json(leaves);
};

exports.approveLeave = async (req, res) => {
  const leave = await Leave.findByIdAndUpdate(req.params.id, { status: "approved" }, { new: true });
  res.json({ message: "Đã phê duyệt", leave });
};

exports.rejectLeave = async (req, res) => {
  const leave = await Leave.findByIdAndUpdate(req.params.id, { status: "rejected" }, { new: true });
  res.json({ message: "Đã từ chối", leave });
};

exports.addSalary = async (req, res) => {
  const { userId, amount, month } = req.body;
  const salary = new Salary({ userId, amount, month });
  await salary.save();
  res.json(salary);
};

exports.getSalaries = async (req, res) => {
  const list = await Salary.find().populate("userId", "username");
  res.json(list);
};
