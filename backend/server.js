// =========================================
// 📦 HRM BACKEND SERVER — web safe + mobile alias
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
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || ["*"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("join", ({ userId, department }) => {
    if (userId) socket.join(`user:${userId}`);
    if (department) socket.join(`dept:${department}`);
  });

  socket.on("join_room", ({ roomId }) => {
    if (!roomId) return;
    socket.join(String(roomId));
    console.log(`🔌 ${socket.id} joined room ${roomId}`);
  });

  socket.on("leave_room", ({ roomId }) => {
    if (!roomId) return;
    socket.leave(String(roomId));
    console.log(`🔌 ${socket.id} left room ${roomId}`);
  });

  socket.on("send_message", (payload = {}) => {
    // Chuẩn hoá payload phát ra
    const out = {
      _id: payload._id || Date.now().toString(),              // nếu client không gửi _id
      roomId: payload.roomId ? String(payload.roomId) : null,
      content: payload.content ?? payload.message ?? "",
      fromUserId: payload.fromUserId ?? null,
      fromUserName: payload.fromUserName ?? payload.fromUsername ?? "N/A",
      createdAt: payload.createdAt || new Date().toISOString(),
    };

    console.log("💬 send_message >", out);

    // Ưu tiên theo roomId (web/app mới)
    if (out.roomId) {
      // ⬇️ không echo về chính socket đang gửi
      socket.to(out.roomId).emit("receive_message", out);
      return;
    }

    // Giữ tương thích cũ (nếu client cũ vẫn bắn type)
    if (payload?.type === "private" && payload?.toUserId) {
      socket.to(`user:${payload.toUserId}`).emit("receive_message", out);
    } else if (payload?.type === "group" && payload?.department) {
      socket.to(`dept:${payload.department}`).emit("receive_message", out);
    } else {
      // fallback cuối cùng: phát cho người khác (trừ mình)
      socket.broadcast.emit("receive_message", out);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔌 Socket disconnected:", socket.id);
  });
});



// ===== MIDDLEWARE =====
app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN?.split(",") || [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:8081",
        // Android emulator → localhost máy
        "http://10.0.2.2:3000",
        "http://10.0.2.2:5173",
        "http://10.0.2.2:8080",
        "http://10.0.2.2:8081",
        "*",
      ],
    credentials: true,
  })
);
app.use(express.json());

// ===== NO-CACHE =====
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

// Static files
app.use("/uploads", express.static("uploads"));

// ===== MONGO =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ===== HEALTH =====
app.get("/", (req, res) => res.json({ ok: true, service: "HRM Backend" }));
app.get("/api", (req, res) => res.json({ ok: true, service: "HRM Backend (API root)" }));

// ===== ROUTES IMPORT =====
const authRoutes = require("./routes/authRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");

// Các route dưới đây có thể không tồn tại trong dự án của bạn.
// Dùng try/catch để tránh crash nếu thiếu.
let employeeRoutes,
  leaveRoutes,
  messageRoutes,
  notificationRoutes,
  workScheduleRoutes,
  reportRoutes,
  adminRoutes,
  salaryRoutes;
try { employeeRoutes = require("./routes/employeeRoutes"); } catch { console.warn("⚠️ employeeRoutes chưa có"); }
try { leaveRoutes = require("./routes/leaveRoutes"); } catch { console.warn("⚠️ leaveRoutes chưa có"); }
try { messageRoutes = require("./routes/messageRoutes"); } catch { console.warn("⚠️ messageRoutes chưa có"); }
try { notificationRoutes = require("./routes/notificationRoutes"); } catch { console.warn("⚠️ notificationRoutes chưa có"); }
try { workScheduleRoutes = require("./routes/workScheduleRoutes"); } catch { console.warn("⚠️ workScheduleRoutes chưa có"); }
try { reportRoutes = require("./routes/reportRoutes"); } catch { console.warn("⚠️ reportRoutes chưa có"); }
try { adminRoutes = require("./routes/adminRoutes"); } catch { console.warn("⚠️ adminRoutes chưa có"); }
try { salaryRoutes = require("./routes/salaryRoutes"); } catch { console.warn("⚠️ salaryRoutes chưa có"); }

// ===== MOUNT ROUTES — GIỮ route cũ CHO WEB + THÊM alias /api CHO MOBILE =====

// Auth
app.use("/auth", authRoutes);                 // legacy (web)
app.use("/api/auth", authRoutes);             // mobile

// Employees / Profile
if (employeeRoutes) {
  app.use("/employees", employeeRoutes);      // legacy (web)
  app.use("/api/employees", employeeRoutes);  // mobile
}

// Attendance
app.use("/attendance", attendanceRoutes);     // legacy (web)
app.use("/api/attendance", attendanceRoutes); // mobile

// Leave requests
if (leaveRoutes) {
  app.use("/leave-requests", leaveRoutes);         // legacy (web)
  app.use("/api/leave-requests", leaveRoutes);     // mobile
}

// Messages / Chat
if (messageRoutes) {
  app.use("/messages", messageRoutes);        // legacy (web)
  app.use("/api/messages", messageRoutes);    // mobile
}

// Notifications
if (notificationRoutes) {
  app.use("/notifications", notificationRoutes);        // legacy (web)
  app.use("/api/notifications", notificationRoutes);    // mobile
}

// Work schedule
if (workScheduleRoutes) {
  app.use("/work-schedule", workScheduleRoutes);        // legacy (web)
  app.use("/api/work-schedule", workScheduleRoutes);    // mobile
}

// Reports
if (reportRoutes) {
  app.use("/report", reportRoutes);             // legacy (web)
  app.use("/api/report", reportRoutes);         // mobile
}

// Admin
if (adminRoutes) {
  app.use("/admin", adminRoutes);               // legacy (web)
  app.use("/api/admin", adminRoutes);           // mobile
}

// Salary — mount ở CẢ 2 đường dẫn
if (salaryRoutes) {
  app.use("/salary", salaryRoutes);                 // legacy (web)
  app.use("/api/salary", salaryRoutes);             // mobile (user)
  app.use("/api/admin/salary", salaryRoutes);       // mobile (admin) nếu cần
  console.log("💰 Salary routes at /salary, /api/salary & /api/admin/salary");
} else {
  console.warn("⚠️ Salary route chưa được cấu hình");
}

// ===== ERROR HANDLERS =====
const { notFound, errorHandler } = require("./middleware/errorHandler");
app.use(notFound);
app.use(errorHandler);

// ===== START =====
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Export io nếu cần dùng nơi khác (gửi noti server-side)
module.exports = { io };
