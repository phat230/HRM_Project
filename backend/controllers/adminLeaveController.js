const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const User = require("../models/User");

exports.getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate({
        path: "userId",
        model: "User",
        select: "username role",
      })
      .populate({
        path: "userId",
        populate: {
          path: "employeeData",
          model: "Employee",
        },
      });

    // nếu Employee không liên kết trong User → tự tìm theo userId
    const fixed = await Promise.all(
      leaves.map(async (l) => {
        const emp = await Employee.findOne({ userId: l.userId?._id });
        return {
          ...l._doc,
          employee: emp || null,
        };
      })
    );

    res.json(fixed);
  } catch (err) {
    console.error("❌ getAllLeaves Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.approveLeave = async (req, res) => {
  await Leave.findByIdAndUpdate(req.params.id, { status: "approved" });
  res.json({ success: true });
};

exports.rejectLeave = async (req, res) => {
  await Leave.findByIdAndUpdate(req.params.id, { status: "rejected" });
  res.json({ success: true });
};
