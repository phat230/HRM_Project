const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// MODELS
const User = require("../models/User");
const Employee = require("../models/Employee");
const Leave = require("../models/Leave");
const Salary = require("../models/Salary");
const Attendance = require("../models/Attendance");
const PerformanceReview = require("../models/PerformanceReview");
const Document = require("../models/Document");
const WorkSchedule = require("../models/WorkSchedule");
const Notification = require("../models/Notification");

// Controllers
const salaryController = require("../controllers/salaryController");

// Middleware
const auth = require("../middleware/authMiddleware");

const router = express.Router();

/* ================================================================
    📌 NHÂN VIÊN
================================================================ */
router.get("/employees", auth(["admin"]), async (req, res) => {
  try {
    const employees = await Employee.find().populate("userId", "username role");
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➕ Thêm nhân viên
router.post("/employees", auth(["admin"]), async (req, res) => {
  try {
    const { username, password, name, department, position, role } = req.body;

    if (!username || !password || !name || !department || !position)
      return res.status(400).json({ error: "Thiếu thông tin nhân viên" });

    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ error: "Username đã tồn tại" });

    const hashed = await bcrypt.hash(password, 10);

    // Tạo User
    const newUser = await User.create({
      username,
      password: hashed,
      role: role || "employee",
    });

    // Tạo Employee profile
    const newEmployee = await Employee.create({
      userId: newUser._id,
      name,
      department,
      position,
    });

    // Gắn employeeData vào User
    await User.findByIdAndUpdate(newUser._id, { employeeData: newEmployee._id });

    // Tạo lương mặc định
    const salary = await Salary.create({
      userId: newUser._id,
      hourlyRate: 100000,
      amount: 0,
      date: new Date(),
    });

    res.json({
      message: "✅ Thêm nhân viên thành công",
      employee: newEmployee,
      salary,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✏ Cập nhật nhân viên
router.put("/employees/:id", auth(["admin"]), async (req, res) => {
  try {
    const { name, department, position, role } = req.body;

    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ error: "Không tìm thấy nhân viên" });

    if (role) await User.findByIdAndUpdate(emp.userId, { role });

    emp.name = name || emp.name;
    emp.department = department || emp.department;
    emp.position = position || emp.position;

    await emp.save();

    res.json({ message: "Cập nhật thành công", employee: emp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ❌ Xóa nhân viên
router.delete("/employees/:id", auth(["admin"]), async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ error: "Không tìm thấy nhân viên" });

    await User.findByIdAndDelete(emp.userId);
    await Salary.deleteMany({ userId: emp.userId });
    await Attendance.deleteMany({ userId: emp.userId });

    await emp.deleteOne();

    res.json({ message: "🗑️ Đã xóa nhân viên và dữ liệu liên quan" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ========================= NGHỈ PHÉP ========================= */
router.get("/leave-requests", auth(["admin"]), async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate("userId", "username")
      .sort({ createdAt: -1 });

    const result = await Promise.all(
      leaves.map(async (l) => {
        const emp = await Employee.findOne({ userId: l.userId?._id });

        return {
          _id: l._id,
          username: l.userId?.username || "—",

          // 🔥 FRONTEND dùng các field này
          realName: emp?.name || "—",
          department: emp?.department || "—",
          position: emp?.position || "—",

          from: l.from,
          to: l.to,
          reason: l.reason,
          status: l.status,
          createdAt: l.createdAt
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("❌ leave-requests ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});



// ✔ approve / reject
router.put("/leave-requests/:id/approve", auth(["admin"]), async (req, res) => {
  const leave = await Leave.findByIdAndUpdate(
    req.params.id,
    { status: "approved" },
    { new: true }
  );
  res.json({ message: "Đã phê duyệt", leave });
});

router.put("/leave-requests/:id/reject", auth(["admin"]), async (req, res) => {
  const leave = await Leave.findByIdAndUpdate(
    req.params.id,
    { status: "rejected" },
    { new: true }
  );
  res.json({ message: "Đã từ chối", leave });
});

/* ================================================================
    📌 QUẢN LÝ LƯƠNG
================================================================ */
router.get("/salary", auth(["admin"]), salaryController.getAllSalaries);

router.put("/salary/:id", auth(["admin"]), salaryController.updateSalary);


/* ================================================================
    📌 CHẤM CÔNG
================================================================ */
router.get("/attendance", auth(["admin"]), async (req, res) => {
  const list = await Attendance.find()
    .populate("userId", "username role")
    .sort({ date: -1 });

  res.json(list);
});


/* ================================================================
    📌 ĐÁNH GIÁ HIỆU SUẤT
================================================================ */
router.get("/performance", auth(["admin"]), async (req, res) => {
  try {
    const reviews = await PerformanceReview.find().populate(
      "userId",
      "username role"
    );
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/performance", auth(["admin"]), async (req, res) => {
  try {
    const review = await PerformanceReview.create(req.body);
    res.json({ message: "Đã thêm đánh giá", review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/performance/:id", auth(["admin"]), async (req, res) => {
  try {
    const updated = await PerformanceReview.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated)
      return res.status(404).json({ error: "Không tìm thấy đánh giá" });

    res.json({ message: "Đã cập nhật", review: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/performance/:id", auth(["admin"]), async (req, res) => {
  try {
    const deleted = await PerformanceReview.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ error: "Không tìm thấy đánh giá" });

    res.json({ message: "Đã xóa đánh giá" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ================================================================
    📌 QUẢN LÝ TÀI LIỆU
================================================================ */

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dep = req.body.department || "general";
    const folder = req.body.folder || "Chung";
    const dir = `uploads/documents/${dep}/${folder}`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });


// 📄 Lấy danh sách file
router.get("/documents", auth(["admin", "manager", "employee"]), async (req, res) => {
  try {
    let filter = { isFolder: false };

    if (req.user.role !== "admin") {
      const emp = await Employee.findOne({ userId: req.user.id });
      filter.department = emp?.department || "general";
    }

    const docs = await Document.find(filter)
      .populate("uploadedBy", "username")
      .sort({ uploadedAt: -1 });

    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📁 Lấy danh sách folder
router.get("/documents/folders", auth(["admin", "manager", "employee"]), async (req, res) => {
  try {
    let filter = { isFolder: true };

    if (req.user.role !== "admin") {
      const emp = await Employee.findOne({ userId: req.user.id });
      filter.department = emp?.department || "general";
    }

    const folders = await Document.find(filter).sort({ title: 1 });

    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📤 Upload file
router.post("/documents", auth(["admin", "manager", "employee"]), upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Chưa chọn file" });

    let department = req.body.department;

    // Nhân viên → tự lấy department từ hồ sơ
    if (req.user.role !== "admin") {
      const emp = await Employee.findOne({ userId: req.user.id });
      department = emp?.department;
    }

    const doc = await Document.create({
      title: req.file.originalname,
      department,
      folder: req.body.folder || "Chung",
      filePath: req.file.path,
      fileType: req.file.mimetype,
      uploadedBy: req.user.id,
      isFolder: false,
    });

    res.json({ message: "Upload thành công", doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📁 Tạo thư mục
router.post("/documents/folder", auth(["admin"]), async (req, res) => {
  try {
    const { folderName, department } = req.body;

    if (!folderName)
      return res.status(400).json({ error: "Thiếu tên thư mục" });

    const dep = department || "general";
    const dir = `uploads/documents/${dep}/${folderName}`;

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const folder = await Document.create({
      title: folderName,
      department: dep,
      filePath: dir,
      isFolder: true,
      uploadedBy: req.user.id,
    });

    res.json({ message: "Tạo thư mục thành công", folder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ⬇ Tải file
router.get("/documents/download/:id", auth(["admin", "manager", "employee"]), async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Không tìm thấy file" });

    if (doc.isFolder) return res.status(400).json({ error: "Đây là thư mục" });

    if (req.user.role !== "admin") {
      const emp = await Employee.findOne({ userId: req.user.id });
      if (emp.department !== doc.department)
        return res.status(403).json({ error: "Không có quyền tải file" });
    }

    const filePath = path.resolve(doc.filePath);

    if (!fs.existsSync(filePath))
      return res.status(404).json({ error: "File không tồn tại" });

    res.download(filePath, doc.title);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ❌ Xóa file
router.delete("/documents/:id", auth(["admin"]), async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) return res.status(404).json({ error: "Không tìm thấy file" });

    if (fs.existsSync(doc.filePath)) {
      if (doc.isFolder) {
        fs.rmSync(doc.filePath, { recursive: true });
      } else {
        fs.unlinkSync(doc.filePath);
      }
    }

    await doc.deleteOne();

    res.json({ message: "Đã xóa" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ================================================================
    📌 LỊCH LÀM VIỆC
================================================================ */
router.get("/work-schedule", auth(["admin"]), async (req, res) => {
  try {
    const schedules = await WorkSchedule.find()
      .populate("assignedTo", "username role")
      .sort({ startDate: -1 });

    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/work-schedule", auth(["admin"]), async (req, res) => {
  try {
    const { task, department, assignedTo, startDate, endDate } = req.body;

    if (!task || !assignedTo || !startDate || !endDate)
      return res.status(400).json({ error: "Thiếu thông tin lịch" });

    const schedule = await WorkSchedule.create({
      task,
      department,
      assignedTo,
      startDate,
      endDate,
    });

    res.json({ message: "Đã thêm lịch", schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/work-schedule/:id", auth(["admin"]), async (req, res) => {
  try {
    const updated = await WorkSchedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ error: "Không tìm thấy lịch" });

    res.json({ message: "Cập nhật lịch thành công", schedule: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/work-schedule/:id", auth(["admin"]), async (req, res) => {
  try {
    const deleted = await WorkSchedule.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ error: "Không tìm thấy lịch" });

    res.json({ message: "Đã xóa lịch" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ================================================================
    📌 THÔNG BÁO
================================================================ */
router.get("/notifications", auth(["admin"]), async (req, res) => {
  const noti = await Notification.find()
    .populate("createdBy", "username")
    .sort({ createdAt: -1 });

  res.json(noti);
});

router.post("/notifications", auth(["admin"]), async (req, res) => {
  try {
    const noti = await Notification.create({
      ...req.body,
      createdBy: req.user.id,
    });

    res.json({ message: "Đã gửi thông báo", noti });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/notifications/:id", auth(["admin"]), async (req, res) => {
  try {
    const noti = await Notification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!noti)
      return res.status(404).json({ error: "Không tìm thấy thông báo" });

    res.json({ message: "Đã cập nhật", noti });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/notifications/:id", auth(["admin"]), async (req, res) => {
  try {
    const noti = await Notification.findByIdAndDelete(req.params.id);

    if (!noti)
      return res.status(404).json({ error: "Không tìm thấy thông báo" });

    res.json({ message: "Đã xóa" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
