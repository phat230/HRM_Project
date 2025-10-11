const mongoose = require("mongoose");

const workScheduleSchema = new mongoose.Schema({
  task: { type: String, required: true },
  department: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("WorkSchedule", workScheduleSchema);
