// backend/routes/employeeRoutes.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

// Models
const User = require("../models/User");
const Employee = require("../models/Employee");
const Document = require("../models/Document");
const WorkSchedule = require("../models/WorkSchedule");
const Notification = require("../models/Notification");
const PerformanceReview = require("../models/PerformanceReview");
const Attendance = require("../models/Attendance");

/* ========================= HỒ SƠ CÁ NHÂN ========================= */

// Lấy hồ sơ của chính mình
router.get("/me", auth(["employee", "manager", "admin"]), async (req, res) => {
  try {
    const emp = await Employee.findOne({ userId: req.user.id }).populate("userId", "username role");
    if (!emp) return res.status(404).json({ error: "Không tìm thấy hồ sơ" });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật hồ sơ của chính mình
router.put("/profile", auth(["employee", "manager", "admin"]), async (req, res) => {
  try {
    const emp = await Employee.findOne({ userId: req.user.id });
    if (!emp) return res.status(404).json({ error: "Không tìm thấy hồ sơ" });

    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    if (!name) return res.status(400).json({ error: "Tên hiển thị không được để trống" });

    emp.name = name;
    await emp.save();
    res.json({ message: "✅ Cập nhật thông tin thành công", employee: emp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Đổi mật khẩu
router.put("/change-password", auth(["employee", "manager", "admin"]), async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Thiếu mật khẩu cũ hoặc mật khẩu mới" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "Mật khẩu mới phải từ 6 ký tự" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "Không tìm thấy tài khoản" });

    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) return res.status(400).json({ error: "Mật khẩu cũ không đúng" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "✅ Đổi mật khẩu thành công" });
  } catch (err) {
    console.error("❌ change-password error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ========================= 📂 TÀI LIỆU PHÒNG BAN ========================= */

// 🧭 Cấu hình upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const emp = await Employee.findOne({ userId: req.user.id });
      if (!emp) return cb(new Error("Không tìm thấy phòng ban nhân viên"), null);

      const department = emp.department || "general";
      const folderName = req.body.folder || "Chung";
      const dir = path.join("uploads", "documents", department, folderName);

      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      cb(err, null);
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// 📤 Upload file
router.post(
  "/documents",
  auth(["employee", "manager", "admin"]),
  upload.single("file"),
  async (req, res) => {
    try {
      const emp = await Employee.findOne({ userId: req.user.id });
      if (!emp) return res.status(403).json({ error: "Không tìm thấy phòng ban nhân viên" });

      const doc = new Document({
        title: req.file.originalname,
        department: emp.department || "general",
        folder: req.body.folder || "Chung",
        filePath: req.file.path,
        fileType: req.file.mimetype,
        uploadedBy: req.user.id,
        isFolder: false,
      });

      await doc.save();
      res.json({ message: "✅ Upload thành công", doc });
    } catch (err) {
      console.error("❌ Lỗi upload file:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// 📦 Liệt kê tài liệu
router.get("/documents", auth(["employee", "manager", "admin"]), async (req, res) => {
  try {
    let filter = {};
    if (req.user.role !== "admin") {
      const emp = await Employee.findOne({ userId: req.user.id });
      const dept = emp?.department || "general";
      filter = { department: { $in: [dept, "general"] } };
    }

    const docs = await Document.find(filter)
      .populate("uploadedBy", "_id username role")
      .sort({ uploadedAt: -1 });

    res.json(docs);
  } catch (err) {
    console.error("❌ Lỗi lấy tài liệu:", err);
    res.status(500).json({ error: err.message });
  }
});

// ⬇️ Tải tài liệu
router.get("/documents/download/:id", auth(["employee", "manager", "admin"]), async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Không tìm thấy tài liệu" });

    if (req.user.role !== "admin") {
      const emp = await Employee.findOne({ userId: req.user.id });
      const dept = emp?.department || "__none__";
      if (!(doc.department === "general" || doc.department === dept)) {
        return res.status(403).json({ error: "🚫 Không có quyền tải tài liệu này" });
      }
    }

    const filePath = path.resolve(doc.filePath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File không tồn tại" });

    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(doc.title)}"`);
    res.setHeader("Content-Type", doc.fileType || "application/octet-stream");
    res.download(filePath);
  } catch (err) {
    console.error("❌ Lỗi tải file:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ Xóa tài liệu (người upload, admin hoặc nhân viên cùng phòng ban - trừ thư mục "general")
router.delete("/documents/:id", auth(["employee", "manager", "admin"]), async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Không tìm thấy tài liệu" });

    // ✅ Admin có toàn quyền xóa
    if (req.user.role === "admin") {
      const filePath = path.resolve(doc.filePath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await doc.deleteOne();
      return res.json({ message: "🗑️ Xóa tài liệu thành công (admin)" });
    }

    // ✅ Kiểm tra quyền nhân viên
    const emp = await Employee.findOne({ userId: req.user.id });
    if (!emp) return res.status(403).json({ error: "Không tìm thấy thông tin nhân viên" });

    const isOwner = doc.uploadedBy.toString() === req.user.id;
    const sameDept = emp.department === doc.department;
    const notGeneral = doc.department !== "general";

    if (!isOwner && !(sameDept && notGeneral)) {
      return res.status(403).json({ error: "🚫 Bạn không có quyền xóa tài liệu này" });
    }

    // ✅ Thực hiện xóa file
    const filePath = path.resolve(doc.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await doc.deleteOne();

    res.json({ message: "🗑️ Xóa tài liệu thành công" });
  } catch (err) {
    console.error("❌ Lỗi xóa tài liệu:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================= 📊 HIỆU SUẤT NHÂN VIÊN =========================
router.get("/performance", auth(["employee", "manager", "admin"]), async (req, res) => {
  try {
    const list = await PerformanceReview.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error("❌ Lỗi lấy hiệu suất:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================= 👥 LẤY DANH SÁCH ĐỒNG NGHIỆP CHO CHAT =========================
router.get("/peers", auth(["employee", "manager", "admin"]), async (req, res) => {
  try {
    const { scope } = req.query; // scope = 'dept' hoặc 'all'
    const meId = req.user.id;

    // Lấy thông tin nhân viên hiện tại để biết phòng ban
    const meEmp = await Employee.findOne({ userId: meId });
    if (!meEmp) return res.status(404).json({ error: "Không tìm thấy hồ sơ nhân viên hiện tại" });

    const query = {};
    if (scope !== "all") {
      // Nếu không phải "all" thì chỉ lấy trong phòng ban
      query.department = meEmp.department;
    }

    // Lấy danh sách nhân viên
    const employees = await Employee.find(query)
      .populate("userId", "username role")
      .sort({ name: 1 });

    // Loại bỏ chính mình và định dạng dữ liệu trả về
    const result = employees
      .filter((e) => e.userId && e.userId._id.toString() !== meId)
      .map((e) => ({
        _id: e._id,
        userId: e.userId._id,
        username: e.userId.username,
        name: e.name,
        department: e.department,
      }));

    res.json(result);
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách peers:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
