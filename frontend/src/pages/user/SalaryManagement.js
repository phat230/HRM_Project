// src/pages/user/SalaryManagement.js
import React, { useEffect, useState } from "react";
import api from "../../api";
import UserLayout from "../../layouts/UserLayout";
import { useAuth } from "../../context/AuthContext";

const fmtMoney = (v) =>
  typeof v === "number"
    ? v.toLocaleString("vi-VN")
    : (Number(v || 0)).toLocaleString("vi-VN");

const ymNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function SalaryManagement() {
  const { user } = useAuth(); // 🔥 lấy role thật
  const [month, setMonth] = useState(ymNow());
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/salary/me?month=${encodeURIComponent(month)}`);
      setSalary(res.data?.[0] || null);
    } catch (err) {
      console.error("❌ Salary load error:", err.response?.data || err.message);
      alert("❌ Không tải được dữ liệu lương");
    } finally {
      setLoading(false);
    }
  };

  // ⛔ Chỉ load khi user đã có → tránh lỗi văng
  useEffect(() => {
    if (user) load();
  }, [user, month]);

  if (!user) {
    return (
      <UserLayout>
        <div className="text-center mt-4">Đang tải người dùng...</div>
      </UserLayout>
    );
  }

  if (loading)
    return (
      <UserLayout role={user.role}>
        <div className="text-center mt-4">
          <div className="spinner-border text-primary"></div>
          <div className="mt-2">Đang tải dữ liệu...</div>
        </div>
      </UserLayout>
    );

  if (!salary)
    return (
      <UserLayout role={user.role}>
        <h2>💰 Lương của tôi</h2>
        <div className="alert alert-info mt-3">
          Không có dữ liệu lương trong tháng này.
        </div>
      </UserLayout>
    );

  return (
    <UserLayout role={user.role}>   {/* 🔥 Fix cứng role=employee */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">💰 Lương của tôi</h2>

        <div className="d-flex gap-2">
          <input
            type="month"
            className="form-control"
            style={{ width: 180 }}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <button className="btn btn-outline-secondary" onClick={load}>
            ⟳ Làm mới
          </button>
        </div>
      </div>

      {/* Cards tổng quan */}
      <div className="row g-3 mb-3">
        <div className="col-md-2 col-sm-4">
          <div className="card p-2 text-center shadow-sm">
            <div className="text-muted small">Tháng</div>
            <div className="fw-bold">{salary.month}</div>
          </div>
        </div>

        <div className="col-md-2 col-sm-4">
          <div className="card p-2 text-center shadow-sm">
            <div className="text-muted small">Ngày công</div>
            <div className="fw-bold">{salary.totalDays}</div>
          </div>
        </div>

        <div className="col-md-2 col-sm-4">
          <div className="card p-2 text-center shadow-sm">
            <div className="text-muted small">Phút đi trễ</div>
            <div className="fw-bold">{salary.totalLateMinutes}</div>
          </div>
        </div>

        <div className="col-md-2 col-sm-4">
          <div className="card p-2 text-center shadow-sm">
            <div className="text-muted small">Tiền phạt</div>
            <div className="fw-bold text-danger">
              {fmtMoney(salary.penalty)} đ
            </div>
          </div>
        </div>

        <div className="col-md-2 col-sm-4">
          <div className="card p-2 text-center shadow-sm">
            <div className="text-muted small">Giờ tăng ca</div>
            <div className="fw-bold">{salary.overtimeHours || 0}</div>
          </div>
        </div>

        <div className="col-md-2 col-sm-4">
          <div className="card p-2 text-center shadow-sm">
            <div className="text-muted small">Tiền tăng ca</div>
            <div className="fw-bold text-success">
              {fmtMoney(salary.overtimePay)} đ
            </div>
          </div>
        </div>
      </div>

      {/* Chi tiết */}
      <div className="card shadow-sm p-3">
        <h5 className="mb-3">📋 Chi tiết lương</h5>

        <div className="table-responsive">
          <table className="table table-bordered table-striped align-middle">
            <thead className="table-light">
              <tr>
                <th>Tiền ngày (VND)</th>
                <th>Tiền tăng ca/giờ</th>
                <th>Tiền tăng ca</th>
                <th>Tiền phạt</th>
                <th>Tổng lương</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{fmtMoney(salary.dailyRate)} đ</td>
                <td>{fmtMoney(salary.overtimeRate)} đ</td>
                <td className="text-success fw-bold">
                  {fmtMoney(salary.overtimePay)} đ
                </td>
                <td className="text-danger">{fmtMoney(salary.penalty)} đ</td>
                <td className="fw-bold text-primary">
                  {fmtMoney(salary.amount)} đ
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Ghi chú */}
      <div className="alert alert-secondary mt-3">
        📘 <b>Quy tắc tính lương:</b>
        <ul className="mb-0">
          <li>Đi trễ ≤ 15 phút: không phạt</li>
          <li>Đi trễ 16–30 phút: phạt 30,000đ</li>
          <li>Đi trễ 31–60 phút: phạt 50,000đ</li>
          <li>Đi trễ hơn 1 giờ: phạt 100,000đ</li>
          <li>Đi trễ ≥ 4 giờ: trừ 1 ngày công</li>
        </ul>
      </div>
    </UserLayout>
  );
}
