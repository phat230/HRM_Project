// models/Attendance.js
const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  date: {
    type: String,
    required: true, 
  },

  checkIn: { type: Date, default: null },
  checkOut: { type: Date, default: null },

  // OT tracking
  overtimeStart: { type: Date, default: null },
  overtimeEnd: { type: Date, default: null },

  // Tổng hợp
  totalDays: { type: Number, default: 0 },
  lateMinutes: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  totalHours: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ["Present", "Absent", "Working", "Leave"], 
    default: "Absent",
  },
}, { timestamps: true });

AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);
