import React, { useEffect, useState } from "react";
import api from "../../api";
import SidebarMenu from "../../components/SidebarMenu";

function SalaryManagementAdmin() {
  const [salaries, setSalaries] = useState([]);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ dailyRate: "", overtimeRate: "" });

  // 📥 Load dữ liệu Salary tổng hợp từ Attendance
  const load = async () => {
    try {
      const res = await api.get("/admin/salary");
      console.log("📊 Salary data from server:", res.data);

      const sanitized = res.data.map((s) => ({
        ...s,
        dailyRate: s.dailyRate ?? 0,
        overtimeRate: s.overtimeRate ?? 0,
        penalty: s.penalty ?? 0,
        overtimeHours: s.overtimeHours ?? 0,
        penaltyRate: s.penaltyRate ?? 0,
        amount: s.amount ?? 0,
        month: s.month ?? "-",
        displayName: s.name || s.userId?.username || s.userId || "Chưa có tên",
      }));

      setSalaries(sanitized);
    } catch (err) {
      console.error("❌ API Error:", err.response?.data || err.message);
      alert("❌ Không tải được dữ liệu lương");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (s) => {
    setEditId(s._id);
    setForm({
      dailyRate: s.dailyRate ?? 0,
      overtimeRate: s.overtimeRate ?? 0,
    });
  };

  const saveEdit = async (id) => {
    try {
      await api.put(`/admin/salary/${id}`, form);
      alert("✅ Cập nhật lương thành công");
      setEditId(null);
      setForm({ dailyRate: "", overtimeRate: "" });
      load();
    } catch (err) {
      console.error("❌ Update Error:", err.response?.data || err.message);
      alert("❌ Lỗi cập nhật lương");
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({ dailyRate: "", overtimeRate: "" });
  };

  const formatValue = (val) => {
    if (val === null || val === undefined || val === 0) return "–";
    return val.toLocaleString("vi-VN");
  };

  const formatPercent = (val) => {
    if (!val || val === 0) return "–";
    return (val * 100).toFixed(0) + "%";
  };

  return (
    <div className="container mt-3">
      <div className="row">
        <div className="col-3">
          <SidebarMenu role="admin" />
        </div>
        <div className="col-9">
          <h3>💰 Quản lý lương (Admin)</h3>
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Tháng</th>
                <th>Ngày công</th>
                <th>Phạt (VND)</th>
                <th>% Phạt</th>
                <th>Tăng ca (giờ)</th>
                <th>Tiền ngày (VND)</th>
                <th>Tiền tăng ca (VND/giờ)</th>
                <th>Tổng lương (VND)</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {salaries.length > 0 ? (
                salaries.map((s) => (
                  <tr key={s._id}>
                    <td>{s.displayName}</td>
                    <td>{s.month || "-"}</td>
                    <td>{s.totalDays ? s.totalDays : "–"}</td>
                    <td>{formatValue(s.penalty)}</td>
                    <td>{formatPercent(s.penaltyRate)}</td>
                    <td>{s.overtimeHours ? s.overtimeHours : "–"}</td>
                    <td>
                      {editId === s._id ? (
                        <input
                          className="form-control"
                          value={form.dailyRate}
                          onChange={(e) =>
                            setForm({ ...form, dailyRate: e.target.value })
                          }
                        />
                      ) : (
                        formatValue(s.dailyRate)
                      )}
                    </td>
                    <td>
                      {editId === s._id ? (
                        <input
                          className="form-control"
                          value={form.overtimeRate}
                          onChange={(e) =>
                            setForm({ ...form, overtimeRate: e.target.value })
                          }
                        />
                      ) : (
                        formatValue(s.overtimeRate)
                      )}
                    </td>
                    <td>{formatValue(s.amount)}</td>
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
                  <td colSpan="10" className="text-center">
                    Không có dữ liệu lương
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SalaryManagementAdmin;
