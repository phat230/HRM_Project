// =========================================
// 📦 HRM BACKEND SERVER
// =========================================
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);

// ===== SOCKET.IO =====
const io = new Server(server, { cors: { origin: "*" } });
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("join", ({ userId, department }) => {
    if (userId) socket.join(`user:${userId}`);
    if (department) socket.join(`dept:${department}`);
  });

  socket.on("send_message", (payload) => {
    if (payload.type === "private" && payload.toUserId) {
      io.to(`user:${payload.toUserId}`).emit("receive_message", payload);
      if (payload.fromUserId) {
        io.to(`user:${payload.fromUserId}`).emit("receive_message", payload);
      }
    } else if (payload.type === "group" && payload.department) {
      io.to(`dept:${payload.department}`).emit("receive_message", payload);
    } else if (payload.roomId) {
      io.to(payload.roomId).emit("receive_message", payload);
    } else {
      io.emit("receive_message", payload);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔌 Socket disconnected:", socket.id);
  });
});

// ===== MIDDLEWARE =====
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

// ===== MIDDLEWARE CHỐNG CACHE =====
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

// Static files
app.use("/uploads", express.static("uploads"));

// ===== KẾT NỐI MONGODB =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ===== ROUTES =====
app.get("/", (req, res) => res.json({ ok: true, service: "HRM Backend" }));

// 🔹 Các route cơ bản
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/employees", require("./routes/employeeRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/leave-requests", require("./routes/leaveRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));

// 🔹 Các route mở rộng
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/work-schedule", require("./routes/workScheduleRoutes"));
app.use("/api/report", require("./routes/reportRoutes"));

// 🔹 Route dành cho admin
app.use("/api/admin", require("./routes/adminRoutes"));

// 💰 Salary Routes — mount ở CẢ 2 đường dẫn
try {
  const salaryRoutes = require("./routes/salaryRoutes");
  app.use("/api/salary", salaryRoutes);         // 👉 dành cho nhân viên (user)
  app.use("/api/admin/salary", salaryRoutes);   // 👉 dành cho admin
  console.log("💰 Salary route loaded at /api/salary & /api/admin/salary");
} catch (err) {
  console.warn("⚠️ Salary route chưa được cấu hình");
}

// ===== MIDDLEWARE LỖI =====
const { notFound, errorHandler } = require("./middleware/errorHandler");
app.use(notFound);
app.use(errorHandler);

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = { io };
