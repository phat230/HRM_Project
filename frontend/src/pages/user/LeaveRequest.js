// src/pages/user/LeaveRequest.js
import React, { useState } from "react";
import api from "../../api";
import UserLayout from "../../layouts/UserLayout";
import { useAuth } from "../../context/AuthContext";

export default function LeaveRequest() {
  const { user } = useAuth();   // 🔥 Lấy user thật từ context
  const [form, setForm] = useState({ from: "", to: "", reason: "" });
  const [loading, setLoading] = useState(false);

  // Tránh lỗi khi user chưa load → ngăn văng login
  if (!user) {
    return (
      <UserLayout>
        <div className="p-3 text-center">Đang tải dữ liệu...</div>
      </UserLayout>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.from || !form.to) return alert("Vui lòng chọn đầy đủ ngày!");

    if (new Date(form.from) > new Date(form.to))
      return alert("❌ Ngày bắt đầu không được lớn hơn ngày kết thúc!");

    try {
      setLoading(true);
      await api.post("/leave-requests", form);
      alert("✅ Đã gửi đơn nghỉ phép");

      setForm({ from: "", to: "", reason: "" });
    } catch (err) {
      console.error("❌ Lỗi gửi đơn:", err);
      alert(err.response?.data?.error || "Không thể gửi đơn nghỉ phép!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserLayout role={user.role}>   {/* 🔥 BẮT BUỘC: role phải từ context */}
      <h2 className="mb-3">📌 Xin nghỉ phép</h2>

      <div className="card p-3">
        <form onSubmit={onSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Từ ngày</label>
              <input
                type="date"
                className="form-control"
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Đến ngày</label>
              <input
                type="date"
                className="form-control"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
                required
              />
            </div>
          </div>

          <label className="form-label mt-3">Lý do nghỉ phép</label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Nhập lý do..."
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required
          />

          <button className="btn btn-primary mt-3" disabled={loading}>
            {loading ? "Đang gửi..." : "📤 Gửi đơn"}
          </button>
        </form>
      </div>
    </UserLayout>
  );
}
