const mongoose = require("mongoose");

const workScheduleSchema = new mongoose.Schema({
  task: { type: String, required: true },
  department: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ["todo","in_progress","done","blocked"], default: "todo" }, // ✅ thêm
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("WorkSchedule", workScheduleSchema);
