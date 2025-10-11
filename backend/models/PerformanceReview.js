const mongoose = require("mongoose");

const performanceReviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tasksCompleted: { type: Number, default: 0 }, // Số nhiệm vụ hoàn thành
  communication: { type: Number, default: 0 },  // Điểm giao tiếp
  technical: { type: Number, default: 0 },      // Điểm kỹ thuật
  attitude: { type: Number, default: 10 },      // Thái độ (0 hoặc 10)
  feedback: { type: String },                   // Nhận xét chi tiết
}, { timestamps: true });

module.exports = mongoose.model("PerformanceReview", performanceReviewSchema);
