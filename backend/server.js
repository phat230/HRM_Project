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
    const out = {
      _id: payload._id || Date.now().toString(),
      roomId: payload.roomId ? String(payload.roomId) : null,
      content: payload.content ?? payload.message ?? "",
      createdAt: payload.createdAt || new Date().toISOString(),
      sender: {
        _id: payload.fromUserId ?? null,
        username: payload.fromUserName ?? payload.fromUsername ?? "N/A",
      },
    };

    console.log("💬 send_message >", out);

    if (out.roomId) {
      socket.to(out.roomId).emit("receive_message", out);
      return;
    }

    if (payload?.type === "private" && payload?.toUserId) {
      socket.to(`user:${payload.toUserId}`).emit("receive_message", out);
    } else if (payload?.type === "group" && payload?.department) {
      socket.to(`dept:${payload.department}`).emit("receive_message", out);
    } else {
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

// ===== HEALTH CHECK =====
app.get("/", (req, res) => res.json({ ok: true, service: "HRM Backend" }));
app.get("/api", (req, res) => res.json({ ok: true, service: "HRM Backend (API root)" }));

// ===== ROUTES IMPORT =====
const authRoutes = require("./routes/authRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");

// Optional routes
let employeeRoutes,
  leaveRoutes,
  messageRoutes,
  notificationRoutes,
  workScheduleRoutes,
  reportRoutes,
  adminRoutes,
  salaryRoutes;

try { employeeRoutes = require("./routes/employeeRoutes"); } catch {}
try { leaveRoutes = require("./routes/leaveRoutes"); } catch {}
try { messageRoutes = require("./routes/messageRoutes"); } catch {}
try { notificationRoutes = require("./routes/notificationRoutes"); } catch {}
try { workScheduleRoutes = require("./routes/workScheduleRoutes"); } catch {}
try { reportRoutes = require("./routes/reportRoutes"); } catch {}
try { adminRoutes = require("./routes/adminRoutes"); } catch {}
try { salaryRoutes = require("./routes/salaryRoutes"); } catch {}

// ===== MOUNT ROUTES =====

// Auth OK
app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);

// Employees
if (employeeRoutes) {
  app.use("/api/employees", employeeRoutes);
}

// ===========================================
// ✅ ATTENDANCE — MOUNT ĐÚNG DUY NHẤT 1 LẦN
// ===========================================

console.log("📌 Using attendanceRoutes from:", require.resolve("./routes/attendanceRoutes"));
app.use("/api/attendance", attendanceRoutes);

// ===========================================

if (leaveRoutes) {
  app.use("/api/leave-requests", leaveRoutes);
}

if (messageRoutes) {
  app.use("/api/messages", messageRoutes);
}

if (notificationRoutes) {
  app.use("/api/notifications", notificationRoutes);
}

if (workScheduleRoutes) {
  app.use("/api/work-schedule", workScheduleRoutes);
}

if (reportRoutes) {
  app.use("/api/report", reportRoutes);
}

if (adminRoutes) {
  app.use("/api/admin", adminRoutes);
}

if (salaryRoutes) {
  app.use("/api/salary", salaryRoutes);
  app.use("/api/admin/salary", salaryRoutes);
  console.log("💰 Salary routes mounted");
}

// ===== ERROR HANDLERS =====
const { notFound, errorHandler } = require("./middleware/errorHandler");
app.use(notFound);
app.use(errorHandler);

// ===== START =====
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = { io };
