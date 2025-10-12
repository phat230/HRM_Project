const mongoose = require("mongoose");

const performanceReviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tasksCompleted: { type: Number, default: 0 },
  communication: { type: Number, default: 0 },
  technical: { type: Number, default: 0 },
  attitude: { type: Number, default: 10 },
  feedback: { type: String },

  // ✅ thêm để báo cáo có thể đọc trực tiếp
  score: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("PerformanceReview", performanceReviewSchema);
