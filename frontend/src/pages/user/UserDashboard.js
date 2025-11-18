import React, { useEffect, useState } from "react";
import UserLayout from "../../layouts/UserLayout";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import { useNavigate } from "react-router-dom";

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState(0);
  const [notifications, setNotifications] = useState(0);
  const [performance, setPerformance] = useState(0);

  // 🔥 Load dữ liệu Dashboard
  useEffect(() => {
    loadAttendance();
    loadNotifications();
    loadPerformance();
  }, []);

  // 🕒 Tổng số ngày công tháng này
  const loadAttendance = async () => {
    try {
      const res = await api.get("/attendance");
      const totalDays = res.data?.reduce((sum, x) => sum + (x.totalDays || 0), 0);
      setAttendance(totalDays);
    } catch (err) {
      console.error("❌ Attendance load error:", err);
    }
  };

  // 📢 Số thông báo
  const loadNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data?.length || 0);
    } catch (err) {
      console.error("❌ Notifications load error:", err);
    }
  };

  // 📊 Điểm hiệu suất TB
  const loadPerformance = async () => {
    try {
      const res = await api.get("/employees/performance");
      if (res.data?.length > 0) {
        const scores = res.data.map((r) => {
          const values = [
            r.tasksCompleted,
            r.communication,
            r.technical,
            r.attitude,
          ].filter((v) => typeof v === "number");
          return values.reduce((a, b) => a + b, 0) / values.length;
        });
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        setPerformance(avg.toFixed(1));
      }
    } catch (err) {
      console.error("❌ Performance load error:", err);
    }
  };

  return (
    <UserLayout role={user?.role}>
      <h2 className="mb-3">🏠 Trang tổng quan</h2>

      {/* Banner hướng dẫn */}
      <div className="alert alert-info shadow-sm">
        Xin chào <b>{user?.username}</b> 👋 <br />
        Hãy sử dụng menu bên trái để truy cập các chức năng:
        <ul className="mt-2 mb-0">
          <li>📄 Hồ sơ cá nhân</li>
          <li>🕒 Chấm công</li>
          <li>📂 Tài liệu</li>
          <li>📢 Thông báo</li>
          <li>📊 Hiệu suất</li>
          <li>💬 Chat nội bộ</li>
          <li>💰 Xem lương</li>
          <li>📌 Xin nghỉ phép</li>
        </ul>
      </div>

      {/* CARD DASHBOARD */}
      <div className="row g-3 mt-3">

        {/* 🕒 Chấm công */}
        <div className="col-md-4">
          <div
            className="card shadow-sm p-3 text-center dashboard-card"
            onClick={() => navigate("/user/attendance")}
            style={{ cursor: "pointer" }}
          >
            <h5>🕒 Chấm công</h5>
            <p className="text-muted small">Theo dõi giờ làm mỗi ngày</p>
            <h3 className="text-primary">{attendance} ngày</h3>
          </div>
        </div>

        {/* 📢 Thông báo */}
        <div className="col-md-4">
          <div
            className="card shadow-sm p-3 text-center dashboard-card"
            onClick={() => navigate("/user/notifications")}
            style={{ cursor: "pointer" }}
          >
            <h5>📢 Thông báo</h5>
            <p className="text-muted small">Xem thông báo công ty</p>
            <h3 className="text-danger">{notifications}</h3>
          </div>
        </div>

        {/* 📊 Hiệu suất */}
        <div className="col-md-4">
          <div
            className="card shadow-sm p-3 text-center dashboard-card"
            onClick={() => navigate("/user/performance")}
            style={{ cursor: "pointer" }}
          >
            <h5>📊 Hiệu suất</h5>
            <p className="text-muted small">Kết quả đánh giá của bạn</p>
            <h3 className="text-success">{performance}</h3>
          </div>
        </div>
      </div>

      {/* CSS hover nhỏ */}
      <style>
        {`
          .dashboard-card {
            transition: 0.25s;
            border-radius: 10px;
          }
          .dashboard-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 6px 18px rgba(0,0,0,0.15);
          }
        `}
      </style>
    </UserLayout>
  );
}
