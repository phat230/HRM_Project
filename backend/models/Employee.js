const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    department: String,
    position: String,
    address: String,
    avatar: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
