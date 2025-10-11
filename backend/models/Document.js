const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  title: String,
  department: String,
  folder: String,
  filePath: String,
  fileType: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isFolder: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Document", documentSchema);
