// models/Attendance.js
const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true },          // YYYY-MM-DD
  checkIn: { type: Date },
  checkOut: { type: Date },

  // OT tracking
  overtimeStart: { type: Date },                    // ✅ thêm để router OT dùng
  overtimeEnd: { type: Date },                      // ✅ thêm để router OT dùng

  // Tổng hợp
  totalDays: { type: Number, default: 0 },          // số ngày công
  lateMinutes: { type: Number, default: 0 },        // phút đi trễ
  overtimeHours: { type: Number, default: 0 },      // giờ tăng ca
  totalHours: { type: Number, default: 0 },         // giờ làm (tuỳ chọn, cho báo cáo)

  status: {
    type: String,
    enum: ["Present", "Absent", "Leave"],
    default: "Present"
  },
}, { timestamps: true });

AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true }); // ✅ tránh trùng 1 ngày/user

module.exports = mongoose.model("Attendance", AttendanceSchema);
