const Employee = require("../models/Employee");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// 📌 Lấy danh sách nhân viên
exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().populate("userId", "username role");
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Lấy 1 nhân viên theo ID
exports.getEmployee = async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id).populate("userId", "username role");
    if (!emp) return res.status(404).json({ error: "Không tìm thấy nhân viên" });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Tạo nhân viên mới (tạo cả User)
exports.createEmployee = async (req, res) => {
  try {
    const { username, password, name, department, position, role } = req.body;

    if (!username || !password || !name || !department || !position) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin" });
    }

    // kiểm tra username trùng
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: "Username đã tồn tại" });

    // hash mật khẩu
    const hashed = await bcrypt.hash(password, 10);

    // tạo User
    const newUser = new User({
      username,
      password: hashed,
      role: role || "employee",
    });
    const savedUser = await newUser.save();

    // tạo Employee
    const newEmployee = new Employee({
      userId: savedUser._id,
      name,
      department,
      position,
    });
    await newEmployee.save();

    res.json({ message: "✅ Thêm nhân viên thành công", employee: newEmployee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Cập nhật nhân viên
exports.updateEmployee = async (req, res) => {
  try {
    const { name, department, position, role } = req.body;
    const emp = await Employee.findById(req.params.id);

    if (!emp) return res.status(404).json({ error: "Không tìm thấy nhân viên" });

    emp.name = name || emp.name;
    emp.department = department || emp.department;
    emp.position = position || emp.position;
    await emp.save();

    // cập nhật role trong User nếu có
    if (role) {
      await User.findByIdAndUpdate(emp.userId, { role });
    }

    res.json({ message: "✅ Cập nhật thành công", employee: emp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Xóa nhân viên (và cả User liên kết)
exports.deleteEmployee = async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ error: "Không tìm thấy nhân viên" });

    await User.findByIdAndDelete(emp.userId);
    await emp.deleteOne();

    res.json({ message: "🗑️ Xóa nhân viên thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
  