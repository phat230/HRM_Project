// models/Attendance.js
const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },

  // ✅ Thêm mới
  totalDays: { type: Number, default: 0 },         // số ngày công
  lateMinutes: { type: Number, default: 0 },       // phút đi trễ
  overtimeHours: { type: Number, default: 0 },     // giờ tăng ca

  status: {
    type: String,
    enum: ["Present", "Absent", "Leave"],
    default: "Present"
  },
});

module.exports = mongoose.model("Attendance", AttendanceSchema);
