import React, { useEffect, useState } from "react";
import api from "../../api";
import SidebarMenu from "../../components/SidebarMenu";

const fmtMoney = (v) =>
  typeof v === "number"
    ? v.toLocaleString("vi-VN")
    : (Number(v || 0)).toLocaleString("vi-VN");

const ymNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function SalaryManagement() {
  const [month, setMonth] = useState(ymNow());
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Gửi month khi load
  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/salary/me?month=${encodeURIComponent(month)}`);
      const data = res.data?.[0];
      setSalary(data || null);
    } catch (err) {
      console.error("❌ Salary load error:", err.response?.data || err.message);
      alert("❌ Không tải được dữ liệu lương");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  if (loading)
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <div className="mt-2">Đang tải dữ liệu...</div>
      </div>
    );

  if (!salary)
    return (
      <div className="container mt-3">
        <div className="row">
          <div className="col-3">
            <SidebarMenu role="employee" />
          </div>
          <div className="col-9">
            <h3>💰 Lương của tôi</h3>
            <div className="alert alert-info">Không có dữ liệu lương trong tháng này.</div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="container mt-3">
      <div className="row">
        <div className="col-3">
          <SidebarMenu role="employee" />
        </div>

        <div className="col-9">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h3 className="mb-0">💰 Lương của tôi</h3>
            <div className="d-flex gap-2 align-items-center">
              <input
                type="month"
                className="form-control"
                style={{ width: 180 }}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
              <button className="btn btn-outline-secondary" onClick={load} disabled={loading}>
                ⟳ {loading ? "Đang tải..." : "Làm mới"}
              </button>
            </div>
          </div>

          {/* Card tóm tắt */}
          <div className="row g-2 mb-3">
            <div className="col">
              <div className="card p-2 text-center">
                <div className="small text-muted">Tháng</div>
                <div className="fw-bold">{salary.month}</div>
              </div>
            </div>

            <div className="col">
              <div className="card p-2 text-center">
                <div className="small text-muted">Ngày công</div>
                <div className="fw-bold">{salary.totalDays}</div>
              </div>
            </div>

            <div className="col">
              <div className="card p-2 text-center">
                <div className="small text-muted">Phút đi trễ</div>
                <div className="fw-bold">{salary.totalLateMinutes}</div>
              </div>
            </div>

            <div className="col">
              <div className="card p-2 text-center">
                <div className="small text-muted">Tiền phạt</div>
                <div className="fw-bold text-danger">{fmtMoney(salary.penalty)} đ</div>
              </div>
            </div>

            <div className="col">
              <div className="card p-2 text-center">
                <div className="small text-muted">Giờ tăng ca</div>
                <div className="fw-bold">{salary.overtimeHours || 0}</div>
              </div>
            </div>

            <div className="col">
              <div className="card p-2 text-center">
                <div className="small text-muted">Tiền tăng ca</div>
                <div className="fw-bold text-success">{fmtMoney(salary.overtimePay)} đ</div>
              </div>
            </div>
          </div>

          {/* Bảng chi tiết */}
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead className="table-light">
                <tr>
                  <th>Tiền ngày (VND)</th>
                  <th>Tiền tăng ca/giờ (VND)</th>
                  <th>Tiền tăng ca (VND)</th>
                  <th>Tiền phạt (VND)</th>
                  <th>Tổng lương (VND)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{fmtMoney(salary.dailyRate)} đ</td>
                  <td>{fmtMoney(salary.overtimeRate)} đ</td>
                  <td>{fmtMoney(salary.overtimePay)} đ</td>
                  <td className="text-danger">{fmtMoney(salary.penalty)} đ</td>
                  <td className="fw-bold text-success">{fmtMoney(salary.amount)} đ</td>
                </tr>
              </tbody>
            </table>
          </div>

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
        </div>
      </div>
    </div>
  );
}