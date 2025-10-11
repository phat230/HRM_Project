const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["private", "group"], required: true },
    name: { type: String }, // tên nhóm, vd: "Phòng IT"
    department: { type: String }, // dùng cho group
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatRoom", chatRoomSchema);
