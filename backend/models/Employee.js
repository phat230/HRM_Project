const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    department: String,
    position: String,
    address: String,
    avatar: String,

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
