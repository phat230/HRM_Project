const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const auth = require("../middleware/authMiddleware");
const WorkSchedule = require("../models/WorkSchedule");
const Document = require("../models/Document");
const Employee = require("../models/Employee");

// =================== 📅 LỊCH LÀM VIỆC ===================
router.get("/work-schedule/my", auth(["employee", "manager"]), async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const list = await WorkSchedule.find({
    $or: [{ assignedTo: userId }, { department: req.user.department }],
  }).sort({ startDate: 1 });
  res.json(list);
});

router.put("/work-schedule/:id/status", auth(["employee", "manager"]), async (req, res) => {
  const { status } = req.body;
  const task = await WorkSchedule.findOneAndUpdate(
    { _id: req.params.id, assignedTo: req.user.id },
    { status },
    { new: true }
  );
  if (!task) return res.status(403).json({ error: "Không có quyền cập nhật" });
  res.json({ message: "✅ Đã cập nhật trạng thái", task });
});

// =================== 📂 TÀI LIỆU PHÒNG BAN ===================

// 🧭 Cấu hình lưu file
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const emp = await Employee.findOne({ userId: req.user.id });
    if (!emp) return cb(new Error("Không tìm thấy phòng ban nhân viên"), null);
    const department = emp.department;
    const folderName = req.body.folder || "Chung";
    const dir = path.join("uploads", "documents", department, folderName);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// 📤 Upload file
router.post("/documents", auth(["employee", "manager"]), upload.single("file"), async (req, res) => {
  try {
    const emp = await Employee.findOne({ userId: req.user.id });
    if (!emp) return res.status(403).json({ error: "Không tìm thấy phòng ban nhân viên" });

    const doc = new Document({
      title: req.file.originalname,
      department: emp.department,
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
});

// 📦 Danh sách file theo phòng ban
router.get("/documents", auth(["employee", "manager"]), async (req, res) => {
  try {
    const emp = await Employee.findOne({ userId: req.user.id });
    if (!emp) return res.status(403).json({ error: "Không tìm thấy phòng ban" });

    const docs = await Document.find({ department: emp.department, isFolder: false })
      .populate("uploadedBy", "username")
      .sort({ uploadedAt: -1 });

    res.json(docs);
  } catch (err) {
    console.error("❌ Lỗi lấy tài liệu:", err);
    res.status(500).json({ error: err.message });
  }
});

// ⬇️ Tải file UTF-8
router.get("/documents/download/:id", auth(["employee", "manager"]), async (req, res) => {
  try {
    const emp = await Employee.findOne({ userId: req.user.id });
    const doc = await Document.findById(req.params.id);

    if (!doc) return res.status(404).json({ error: "Không tìm thấy tài liệu" });
    if (!emp || emp.department !== doc.department) {
      return res.status(403).json({ error: "Bạn không có quyền tải tài liệu này" });
    }

    const filePath = path.resolve(doc.filePath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File không tồn tại" });

    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(doc.title)}`);
    res.setHeader("Content-Type", doc.fileType);
    res.download(filePath);
  } catch (err) {
    console.error("❌ Lỗi tải file:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🗑️ Xóa file
router.delete("/documents/:id", auth(["employee", "manager", "admin"]), async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Không tìm thấy tài liệu" });

    if (req.user.role !== "admin" && doc.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Bạn không có quyền xóa tài liệu này" });
    }

    if (fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath);
    await doc.deleteOne();
    res.json({ message: "🗑️ Đã xóa tài liệu" });
  } catch (err) {
    console.error("❌ Lỗi xóa file:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
