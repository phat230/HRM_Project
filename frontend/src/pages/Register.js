import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Register() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    department: "",
    position: "",
    role: "employee", // ✅ Luôn mặc định là employee
  });
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/register", form);

      // ✅ Tự động đăng nhập sau khi đăng ký
      localStorage.setItem(
        "authUser",
        JSON.stringify({
          token: res.data.token,
          user: res.data.user,
        })
      );

      navigate("/user/dashboard");
    } catch (err) {
      alert(err.response?.data?.error || "Có lỗi xảy ra");
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 520 }}>
      <h3>📝 Đăng ký tài khoản nhân viên</h3>
      <form onSubmit={onSubmit}>
        <input
          name="username"
          className="form-control mb-2"
          placeholder="Tên đăng nhập"
          onChange={onChange}
          required
        />
        <input
          name="password"
          type="password"
          className="form-control mb-2"
          placeholder="Mật khẩu"
          onChange={onChange}
          required
        />
        <input
          name="name"
          className="form-control mb-2"
          placeholder="Họ và tên"
          onChange={onChange}
          required
        />

        {/* ✅ chọn phòng ban */}
        <select
          name="department"
          className="form-control mb-2"
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
          className="form-control mb-3"
          placeholder="Chức vụ (VD: Nhân viên, Thực tập...)"
          onChange={onChange}
          required
        />

        {/* Không hiển thị chọn role nữa */}
        <button className="btn btn-success w-100">Đăng ký</button>
      </form>
    </div>
  );
}

export default Register;
