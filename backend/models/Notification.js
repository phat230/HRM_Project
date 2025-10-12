const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  target: { type: String, enum: ["all", "employee", "department", "user"], default: "all" }, // ✅ thêm 'user'
  targetValue: { type: String }, // userId hoặc department
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
