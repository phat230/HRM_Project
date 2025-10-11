const Leave = require("../models/Leave");

exports.createLeave = async (req, res) => {
  const { from, to, reason } = req.body;
  const leave = new Leave({ userId: req.user.id, from, to, reason });
  await leave.save();
  res.json(leave);
};

exports.getMyLeaves = async (req, res) => {
  const leaves = await Leave.find({ userId: req.user.id });
  res.json(leaves);
};
