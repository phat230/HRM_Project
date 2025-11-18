const Leave = require("../models/Leave");
const Employee = require("../models/Employee");

exports.createLeave = async (req, res) => {
  try {
    const { from, to, reason } = req.body;

    if (!from || !to)
      return res.status(400).json({ error: "Thiếu ngày nghỉ" });

    const leave = new Leave({
      userId: req.user.id,
      from,
      to,
      reason,
    });

    await leave.save();
    res.json({ message: "Đã gửi yêu cầu nghỉ phép", leave });

  } catch (err) {
    console.error("❌ createLeave Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


exports.getMyLeaves = async (req, res) => {
  try {
    const list = await Leave.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error("❌ getMyLeaves Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
