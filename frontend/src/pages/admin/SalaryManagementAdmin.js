import React, { useEffect, useMemo, useState } from "react";
import api from "../../api";
import AdminLayout from "../../layouts/AdminLayout";

const fmtMoney = (v) =>
  typeof v === "number"
    ? v.toLocaleString("vi-VN")
    : (Number(v || 0)).toLocaleString("vi-VN");

const ymNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function SalaryManagementAdmin() {
  const [month, setMonth] = useState(ymNow());
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    dailyRate: "",
    overtimeRate: "",
    penalty: "",
    totalDays: "",
  });

  const totalSummary = useMemo(() => {
    const sum = (k) => salaries.reduce((acc, s) => acc + Number(s[k] || 0), 0);
    return {
      totalDays: sum("totalDays"),
      overtimeHours: sum("overtimeHours"),
      penalty: sum("penalty"),
      overtimePay: sum("overtimePay"),
      amount: sum("amount"),
    };
  }, [salaries]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/salary?month=${encodeURIComponent(month)}`);
      const data = (res.data || []).map((s) => ({
        ...s,
        displayName: s.name || s.userId?.username || s.username || "Chưa có tên",
        month: s.month || month,
        dailyRate: s.dailyRate ?? 0,
        overtimeRate: s.overtimeRate ?? 0,
        overtimePay:
          s.overtimePay ?? Number(s.overtimeHours || 0) * Number(s.overtimeRate || 0),
        penalty: s.penalty ?? 0,
        totalDays: s.totalDays ?? 0,
        amount: s.amount ?? 0,
      }));
      setSalaries(data);
    } catch (err) {
      console.error("❌ Salary load error:", err.response?.data || err.message);
      alert("❌ Không tải được dữ liệu lương");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [month]);

  const startEdit = (row) => {
    setEditId(row._id);
    setForm({
      dailyRate: row.dailyRate ?? 0,
      overtimeRate: row.overtimeRate ?? 0,
      penalty: row.penalty ?? 0,
      totalDays: row.totalDays ?? 0,
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({ dailyRate: "", overtimeRate: "", penalty: "", totalDays: "" });
  };

  const saveEdit = async (id) => {
    try {
      await api.put(`/salary/${id}`, {
        dailyRate: Number(form.dailyRate),
        overtimeRate: Number(form.overtimeRate),
        penalty: Number(form.penalty),
        totalDays: Number(form.totalDays),
      });
      alert("✅ Cập nhật lương thành công");
      cancelEdit();
      load();
    } catch (err) {
      console.error("❌ Update salary error:", err.response?.data || err.message);
      alert("❌ Lỗi cập nhật lương");
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">💰 Quản lý lương (Admin)</h2>

        <div className="d-flex gap-2 align-items-center">
          <input
            type="month"
            className="form-control"
            style={{ width: 180 }}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <button
            className="btn btn-outline-secondary"
            onClick={load}
            disabled={loading}
          >
            ⟳ {loading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="row g-2 mb-3">
        <div className="col">
          <div className="card p-2 text-center">
            <div className="small text-muted">Tổng ngày công</div>
            <div className="fw-bold">{totalSummary.totalDays}</div>
          </div>
        </div>
        <div className="col">
          <div className="card p-2 text-center">
            <div className="small text-muted">Tổng giờ tăng ca</div>
            <div className="fw-bold">{totalSummary.overtimeHours}</div>
          </div>
        </div>
        <div className="col">
          <div className="card p-2 text-center">
            <div className="small text-muted">Tổng phạt</div>
            <div className="fw-bold">{fmtMoney(totalSummary.penalty)} đ</div>
          </div>
        </div>
        <div className="col">
          <div className="card p-2 text-center">
            <div className="small text-muted">Tổng tiền tăng ca</div>
            <div className="fw-bold">{fmtMoney(totalSummary.overtimePay)} đ</div>
          </div>
        </div>
        <div className="col">
          <div className="card p-2 text-center">
            <div className="small text-muted">Tổng lương</div>
            <div className="fw-bold">{fmtMoney(totalSummary.amount)} đ</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-3">
        <h5>📄 Chi tiết lương nhân viên</h5>

        <div className="table-responsive mt-2">
          <table className="table table-bordered table-striped align-middle">
            <thead className="table-light">
              <tr>
                <th>Nhân viên</th>
                <th>Phòng ban</th>
                <th>Tháng</th>
                <th>Ngày công</th>
                <th>Phút trễ</th>
                <th>Phạt (VND)</th>
                <th>Tăng ca (giờ)</th>
                <th>Tiền ngày (VND)</th>
                <th>Tiền tăng ca/giờ</th>
                <th>Tiền tăng ca</th>
                <th>Tổng lương</th>
                <th style={{ width: 160 }}>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {salaries.length > 0 ? (
                salaries.map((s) => (
                  <tr key={s._id}>
                    <td>{s.displayName}</td>
                    <td>{s.department || "–"}</td>
                    <td>{s.month}</td>

                    <td>
                      {editId === s._id ? (
                        <input
                          className="form-control"
                          type="number"
                          value={form.totalDays}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, totalDays: e.target.value }))
                          }
                        />
                      ) : (
                        s.totalDays
                      )}
                    </td>

                    <td>{s.totalLateMinutes ?? 0}</td>

                    <td>
                      {editId === s._id ? (
                        <input
                          className="form-control"
                          type="number"
                          value={form.penalty}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, penalty: e.target.value }))
                          }
                        />
                      ) : (
                        fmtMoney(s.penalty)
                      )}
                    </td>

                    <td>{s.overtimeHours ?? 0}</td>

                    <td>
                      {editId === s._id ? (
                        <input
                          className="form-control"
                          type="number"
                          value={form.dailyRate}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, dailyRate: e.target.value }))
                          }
                        />
                      ) : (
                        fmtMoney(s.dailyRate)
                      )}
                    </td>

                    <td>
                      {editId === s._id ? (
                        <input
                          className="form-control"
                          type="number"
                          value={form.overtimeRate}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, overtimeRate: e.target.value }))
                          }
                        />
                      ) : (
                        fmtMoney(s.overtimeRate)
                      )}
                    </td>

                    <td>{fmtMoney(s.overtimePay)} đ</td>
                    <td className="fw-bold">{fmtMoney(s.amount)} đ</td>

                    <td>
                      {editId === s._id ? (
                        <>
                          <button
                            className="btn btn-success btn-sm me-2"
                            onClick={() => saveEdit(s._id)}
                          >
                            Lưu
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={cancelEdit}
                          >
                            Hủy
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => startEdit(s)}
                        >
                          Sửa
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="text-center">
                    {loading ? "Đang tải..." : "Không có dữ liệu"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
