// src/pages/Register.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

import "../styles/auth.css";
import "../styles/register.css";

function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    department: "",
    position: "",
    role: "employee",
  });

  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/register", form);

      // auto login
      login({ token: res.data.token, user: res.data.user });

      navigate("/user/dashboard");
    } catch (err) {
      alert(err.response?.data?.error || "Có lỗi xảy ra!");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <h2 className="auth-title">📝 Đăng ký tài khoản</h2>
        <p className="auth-sub">Tạo tài khoản nhân viên mới</p>

        <form onSubmit={onSubmit} className="auth-form">
          <input
            name="username"
            className="form-control form-control-lg mb-3"
            placeholder="Tên đăng nhập"
            onChange={onChange}
            required
          />

          <input
            name="password"
            type="password"
            className="form-control form-control-lg mb-3"
            placeholder="Mật khẩu"
            onChange={onChange}
            required
          />

          <input
            name="name"
            className="form-control form-control-lg mb-3"
            placeholder="Họ và tên"
            onChange={onChange}
            required
          />

          <select
            name="department"
            className="form-control form-control-lg mb-3"
            value={form.department}
            onChange={onChange}
            required
          >
            <option value="">-- Chọn phòng ban --</option>
            <option value="IT">IT</option>
            <option value="HR">Nhân sự</option>
            <option value="Kế toán">Kế toán</option>
            <option value="Kinh doanh">Kinh doanh</option>
          </select>

          <input
            name="position"
            className="form-control form-control-lg mb-4"
            placeholder="Chức vụ"
            onChange={onChange}
            required
          />

          <button className="btn btn-success w-100 auth-btn">Đăng ký</button>
        </form>

        <p className="auth-switch">
          Đã có tài khoản?{" "}
          <span onClick={() => navigate("/login")} className="auth-link">
            Đăng nhập ngay
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;
