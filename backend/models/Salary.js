const mongoose = require("mongoose"); 
const moment = require("moment");   

const salarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  dailyRate: { type: Number, default: 300000 },
  overtimeRate: { type: Number, default: 50000 },
  penalty: { type: Number, default: 0 },
  overtimePay: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },

  month: {
    type: String,
    required: true,
    default: () => moment().format("YYYY-MM") 
  }
});

module.exports = mongoose.model("Salary", salarySchema);
