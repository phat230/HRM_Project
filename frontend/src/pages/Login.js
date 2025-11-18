// src/pages/Login.js
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import "../styles/auth.css";
import "../styles/login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        username,
        password,
      });

      // LƯU ĐÚNG CHUẨN
      login({
        token: res.data.token,
        refreshToken: res.data.refreshToken,
        user: res.data.user,
      });

      const role = res.data.user.role;

      role === "admin"
        ? navigate("/admin/dashboard")
        : navigate("/user/dashboard");
    } catch (err) {
      alert(err.response?.data?.error || "Sai tên đăng nhập hoặc mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">🔐 Đăng nhập hệ thống</h2>
        <p className="auth-sub">Quản lý nhân sự - HRM System</p>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="mb-3">
            <label className="form-label">Tên đăng nhập</label>
            <input
              type="text"
              className="form-control form-control-lg"
              placeholder="Nhập tên đăng nhập..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              className="form-control form-control-lg"
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary w-100 auth-btn" disabled={loading}>
            {loading ? "⏳ Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="auth-switch">
          Chưa có tài khoản?{" "}
          <span onClick={() => navigate("/register")} className="auth-link">
            Đăng ký ngay
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
