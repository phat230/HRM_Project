import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
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

      localStorage.setItem(
        "authUser",
        JSON.stringify({
          token: res.data.token,
          user: res.data.user,
        })
      );

      const role = res.data.user.role;
      if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "manager" || role === "employee") {
        navigate("/user/dashboard");
      } else {
        alert("Tài khoản không có quyền truy cập hệ thống.");
      }
    } catch (err) {
      console.error("❌ Lỗi đăng nhập:", err);
      alert(err.response?.data?.error || "Sai tên đăng nhập hoặc mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 400 }}>
      <h3 className="mb-4">🔐 Đăng nhập hệ thống</h3>
      <form onSubmit={handleLogin}>
        <div className="mb-3">
          <label htmlFor="username" className="form-label">Tên đăng nhập</label>
          <input
            id="username"
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Mật khẩu</label>
          <input
            id="password"
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? "⏳ Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      {/* 👉 Thêm link đăng ký */}
      <p className="mt-3 text-center">
        Chưa có tài khoản?{" "}
        <a href="/register" className="text-decoration-none">
          Đăng ký ngay
        </a>
      </p>
    </div>
  );
}

export default Login;
