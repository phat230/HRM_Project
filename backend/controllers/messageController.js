const Message = require("../models/Message");

exports.sendMessage = async (req, res) => {
  const { to, content } = req.body;
  const msg = new Message({ from: req.user.id, to, content });
  await msg.save();
  res.json(msg);
};

exports.getMessages = async (req, res) => {
  const list = await Message.find({
    $or: [
      { from: req.user.id, to: req.params.userId },
      { from: req.params.userId, to: req.user.id }
    ]
  }).populate("from to", "username");
  res.json(list);
};
