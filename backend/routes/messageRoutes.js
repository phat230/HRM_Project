// backend/routes/messageRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const ChatRoom = require("../models/ChatRoom");
const Message = require("../models/Message");
const Employee = require("../models/Employee");

/**
 * 📜 Lấy danh sách phòng chat
 * (Path giữ nguyên — alias /api/messages/* cho mobile)
 */
router.get("/rooms", auth(["employee", "manager", "admin"]), async (req, res) => {
  try {
    const myId = req.user.id;
    const emp = await Employee.findOne({ userId: myId });
    const dept = emp?.department || "Chưa phân phòng";

    // Danh sách phòng private có mình tham gia
    const privateRooms = await ChatRoom.find({
      type: "private",
      participants: myId,
    })
      .populate("participants", "_id username") // 🛠 luôn có _id
      .sort({ updatedAt: -1 });

    // Tạo hoặc lấy phòng ban
    let deptRoom = await ChatRoom.findOne({ type: "group", department: dept });
    if (!deptRoom) {
      deptRoom = await new ChatRoom({
        type: "group",
        name: `Phòng ${dept}`,
        department: dept,
        participants: [myId],
      }).save();
    }

    res.json({ privateRooms, deptRoom });
  } catch (err) {
    console.error("❌ Lỗi load rooms:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 🔸 Tạo hoặc mở phòng private giữa 2 user
 */
router.post(
  "/rooms/private",
  auth(["employee", "manager", "admin"]),
  async (req, res) => {
    try {
      const { otherUserId } = req.body;
      const myId = req.user.id;

      let room = await ChatRoom.findOne({
        type: "private",
        participants: { $all: [myId, otherUserId] },
      }).populate("participants", "_id username"); // 🛠

      if (!room) {
        room = await new ChatRoom({
          type: "private",
          participants: [myId, otherUserId],
        }).save();
        await room.populate("participants", "_id username"); // 🛠
      }

      res.json(room);
    } catch (err) {
      console.error("❌ Lỗi tạo phòng:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * 💬 Lấy lịch sử tin nhắn theo roomId
 */
router.get(
  "/:roomId",
  auth(["employee", "manager", "admin"]),
  async (req, res) => {
    try {
      const { roomId } = req.params;
      const messages = await Message.find({ roomId })
        .populate("sender", "_id username") // 🛠 luôn có _id
        .sort({ createdAt: 1 });

      res.json(messages);
    } catch (err) {
      console.error("❌ Lỗi lấy tin nhắn:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * ✉️ Gửi tin nhắn (lưu luôn DB)
 */
router.post("/", auth(["employee", "manager", "admin"]), async (req, res) => {
  try {
    const { roomId, content } = req.body;
    if (!roomId || !content)
      return res.status(400).json({ error: "Thiếu dữ liệu" });

    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ error: "Không tìm thấy phòng chat" });

    const msg = new Message({
      roomId,
      sender: req.user.id,
      content,
    });
    await msg.save();

    // Cập nhật thời gian hoạt động của phòng
    room.updatedAt = new Date();
    await room.save();

    const populatedMsg = await msg.populate("sender", "_id username"); // 🛠

    res.json(populatedMsg);
  } catch (err) {
    console.error("❌ Lỗi gửi tin nhắn:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/all-rooms", auth(["admin"]), async (req, res) => {
  try {
    const rooms = await ChatRoom.find({ type: "private" })
      .populate("participants", "_id username")
      .sort({ updatedAt: -1 });

    res.json(rooms);
  } catch (err) {
    console.error("❌ Lỗi load all rooms:", err);
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
