const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ======================= MODELS =======================
const User = require("../models/User");
const Employee = require("../models/Employee");
const Leave = require("../models/Leave");
const Salary = require("../models/Salary");
const Attendance = require("../models/Attendance");
const PerformanceReview = require("../models/PerformanceReview");
const Document = require("../models/Document");
const WorkSchedule = require("../models/WorkSchedule");
const Notification = require("../models/Notification");
const salaryController = require("../controllers/salaryController");

// ======================= MIDDLEWARE =======================
const auth = require("../middleware/authMiddleware");
const router = express.Router();

/* ========================= NHÂN VIÊN ========================= */
// Lấy danh sách nhân viên
router.get("/employees", auth(["admin"]), async (req, res) => {
  try {
    const employees = await Employee.find().populate("userId", "username role");
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thêm nhân viên
router.post("/employees", auth(["admin"]), async (req, res) => {
  try {
    const { username, password, name, department, position, role } = req.body;
    if (!username || !password || !name || !department || !position) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin" });
    }

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: "Username đã tồn tại" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashed, role: role || "employee" });
    const savedUser = await newUser.save();

    const newEmployee = new Employee({
      userId: savedUser._id,
      name,
      department,
      position,
    });
    await newEmployee.save();

    const newSalary = new Salary({
      userId: savedUser._id,
      hourlyRate: 100000,
      amount: 0,
      date: new Date(),
    });
    await newSalary.save();

    res.json({
      message: "✅ Thêm nhân viên & tạo lương mặc định thành công",
      employee: newEmployee,
      salary: newSalary,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật nhân viên
router.put("/employees/:id", auth(["admin"]), async (req, res) => {
  try {
    const { name, department, position, role } = req.body;
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ error: "Không tìm thấy nhân viên" });

    emp.name = name || emp.name;
    emp.department = department || emp.department;
    emp.position = position || emp.position;
    await emp.save();

    if (role) await User.findByIdAndUpdate(emp.userId, { role });

    res.json({ message: "✅ Cập nhật thành công", employee: emp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa nhân viên
router.delete("/employees/:id", auth(["admin"]), async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ error: "Không tìm thấy nhân viên" });

    await User.findByIdAndDelete(emp.userId);
    await Salary.deleteMany({ userId: emp.userId });
    await Attendance.deleteMany({ userId: emp.userId });
    await emp.deleteOne();

    res.json({ message: "🗑️ Đã xóa nhân viên + dữ liệu liên quan" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ========================= NGHỈ PHÉP ========================= */
router.get("/leave-requests", auth(["admin"]), async (req, res) => {
  try {
    const leaves = await Leave.find().populate("userId", "username");
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/leave-requests/:id/approve", auth(["admin"]), async (req, res) => {
  const leave = await Leave.findByIdAndUpdate(req.params.id, { status: "approved" }, { new: true });
  res.json({ message: "✅ Đã phê duyệt", leave });
});

router.put("/leave-requests/:id/reject", auth(["admin"]), async (req, res) => {
  const leave = await Leave.findByIdAndUpdate(req.params.id, { status: "rejected" }, { new: true });
  res.json({ message: "❌ Đã từ chối", leave });
});

/* ========================= LƯƠNG ========================= */
// ✅ Lấy danh sách lương
router.get("/salary", auth(["admin"]), salaryController.getAllSalaries);

// ✅ Cập nhật lương theo ID (đã có trong salaryController)
router.put("/salary/:id", auth(["admin"]), (req, res, next) => {
  if (typeof salaryController.updateSalary !== "function") {
    console.error("❌ Lỗi: salaryController.updateSalary không phải là function");
    return res.status(500).json({ error: "Hàm updateSalary không tồn tại" });
  }
  salaryController.updateSalary(req, res, next);
});

/* ========================= CHẤM CÔNG ========================= */
router.get("/attendance", auth(["admin"]), async (req, res) => {
  const list = await Attendance.find().populate("userId", "username role").sort({ date: -1 });
  res.json(list);
});

/* ========================= ĐÁNH GIÁ HIỆU SUẤT ========================= */
router.get("/performance", auth(["admin"]), async (req, res) => {
  try {
    const reviews = await PerformanceReview.find().populate("userId", "username role");
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/performance", auth(["admin"]), async (req, res) => {
  try {
    const review = new PerformanceReview(req.body);
    await review.save();
    res.json({ message: "✅ Đã thêm đánh giá", review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/performance/:id", auth(["admin"]), async (req, res) => {
  try {
    const updated = await PerformanceReview.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("userId", "username");
    if (!updated) return res.status(404).json({ error: "Không tìm thấy đánh giá" });
    res.json({ message: "✅ Đã cập nhật đánh giá", review: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/performance/:id", auth(["admin"]), async (req, res) => {
  try {
    const deleted = await PerformanceReview.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Không tìm thấy đánh giá" });
    res.json({ message: "🗑️ Đã xóa đánh giá" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================= 📂 QUẢN LÝ TÀI LIỆU =========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const department = req.body.department || "general";
    const folder = req.body.folder || "Chung";
    const dir = `uploads/documents/${department}/${folder}`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

/**
 * 📄 API 1: Lấy danh sách FILE
 */
router.get("/documents", auth(["admin", "employee", "manager"]), async (req, res) => {
  try {
    let filter = { isFolder: false }; // ✅ chỉ lấy file
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

/**
 * 📁 API 2: Lấy danh sách FOLDER
 */
router.get("/documents/folders", auth(["admin", "employee", "manager"]), async (req, res) => {
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

// 📤 API 3: Upload file
router.post("/documents", auth(["admin", "employee", "manager"]), upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Vui lòng chọn file" });

    // ✅ Nếu là nhân viên thì tự động gán department từ hồ sơ nhân viên
    let department = req.body.department;
    if (req.user.role === "employee" || req.user.role === "manager") {
      const emp = await require("../models/Employee").findOne({ userId: req.user.id });
      if (!emp) return res.status(403).json({ error: "Không tìm thấy thông tin phòng ban" });
      department = emp.department; // ép theo phòng ban nhân viên
    }

    const doc = new (require("../models/Document"))({
      title: req.file.originalname,
      department: department || "general",
      folder: req.body.folder || "Chung",
      filePath: req.file.path,
      fileType: req.file.mimetype,
      uploadedBy: req.user.id,
      isFolder: false
    });

    await doc.save();
    res.json({ message: "✅ Upload thành công", doc });
  } catch (err) {
    console.error("❌ Lỗi upload file:", err);
    res.status(500).json({ error: err.message });
  }
});


/**
 * 📁 API 4: Tạo thư mục
 */
router.post("/documents/folder", auth(["admin"]), async (req, res) => {
  try {
    const { folderName, department } = req.body;
    if (!folderName) return res.status(400).json({ error: "Thiếu tên thư mục" });

    const dep = department || "general";
    const dir = `uploads/documents/${dep}/${folderName}`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const folder = new Document({
      title: folderName,
      department: dep,
      filePath: dir,
      isFolder: true,
      uploadedBy: req.user.id,
    });

    await folder.save();
    res.json({ message: "📁 Tạo thư mục thành công", folder });
  } catch (err) {
    console.error("❌ Lỗi tạo thư mục:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ⬇️ API 5: Tải file (giữ đúng tên và đuôi file)
 */
router.get("/documents/download/:id", auth(["admin", "employee", "manager"]), async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Không tìm thấy tài liệu" });

    // Không cho tải thư mục
    if (doc.isFolder) return res.status(400).json({ error: "Đây là thư mục, không thể tải" });

    // Kiểm tra quyền truy cập nếu không phải admin
    if (req.user.role !== "admin") {
      const emp = await Employee.findOne({ userId: req.user.id });
      if (!emp || emp.department !== doc.department) {
        return res.status(403).json({ error: "🚫 Không có quyền tải tài liệu này" });
      }
    }

    const filePath = path.resolve(doc.filePath);
    if (!fs.existsSync(filePath)) {
      console.error("❌ File không tồn tại tại đường dẫn:", filePath);
      return res.status(404).json({ error: "File không tồn tại" });
    }

    // 🧾 Lấy tên gốc để tải về đúng định dạng
    const originalFileName = doc.title || path.basename(filePath);
    const ext = path.extname(originalFileName).toLowerCase();

    // 📌 Map đuôi file sang MIME type đúng
    const mimeTypes = {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".txt": "text/plain",
    };
    const mimeType = mimeTypes[ext] || doc.fileType || "application/octet-stream";

    // 📨 Gửi đúng header để trình duyệt hiểu định dạng
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(originalFileName)}"`
    );
    res.setHeader("Content-Type", mimeType);

    return res.download(filePath, originalFileName);
  } catch (err) {
    console.error("❌ Lỗi tải file:", err);
    res.status(500).json({ error: err.message });
  }
});


/**
 * 🗑 API 6: Xóa file hoặc folder
 */
router.delete("/documents/:id", auth(["admin"]), async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Không tìm thấy tài liệu" });

    if (doc.isFolder && fs.existsSync(doc.filePath)) {
      fs.rmSync(doc.filePath, { recursive: true, force: true });
    } else if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }

    await doc.deleteOne();
    res.json({ message: "🗑️ Đã xóa tài liệu hoặc thư mục" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ========================= LỊCH LÀM VIỆC ========================= */

// Lấy danh sách lịch (Admin)
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

// Thêm mới lịch
router.post("/work-schedule", auth(["admin"]), async (req, res) => {
  try {
    const { task, department, assignedTo, startDate, endDate } = req.body;

    if (!task || !assignedTo || !startDate || !endDate)
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin" });

    const schedule = new WorkSchedule({
      task,
      department,
      assignedTo,
      startDate,
      endDate,
    });

    await schedule.save();
    res.json({ message: "✅ Đã thêm lịch làm việc", schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật lịch
router.put("/work-schedule/:id", auth(["admin"]), async (req, res) => {
  try {
    const { task, department, assignedTo, startDate, endDate } = req.body;

    const updated = await WorkSchedule.findByIdAndUpdate(
      req.params.id,
      { task, department, assignedTo, startDate, endDate },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Không tìm thấy lịch" });
    res.json({ message: "✅ Cập nhật lịch thành công", schedule: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa lịch
router.delete("/work-schedule/:id", auth(["admin"]), async (req, res) => {
  try {
    const deleted = await WorkSchedule.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Không tìm thấy lịch" });
    res.json({ message: "🗑️ Đã xóa lịch làm việc" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ========================= THÔNG BÁO ========================= */
router.get("/notifications", auth(["admin"]), async (req, res) => {
  const noti = await Notification.find()
    .populate("createdBy", "username")
    .sort({ createdAt: -1 });
  res.json(noti);
});

router.post("/notifications", auth(["admin"]), async (req, res) => {
  try {
    const { title, message, target, targetValue } = req.body;
    const noti = new Notification({
      title,
      message,
      target,
      targetValue,
      createdBy: req.user.id,
    });
    await noti.save();
    res.json({ message: "✅ Đã gửi thông báo", noti });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/notifications/:id", auth(["admin"]), async (req, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Không tìm thấy thông báo" });
    res.json({ message: "✅ Cập nhật thông báo thành công", noti: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/notifications/:id", auth(["admin"]), async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Không tìm thấy thông báo" });
    res.json({ message: "🗑️ Đã xóa thông báo" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
