import React, { useEffect, useState } from "react";
import api from "../../api";
import AdminLayout from "../../layouts/AdminLayout";

export default function NotificationsAdmin() {
  const [list, setList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments] = useState(["IT", "HR", "Finance", "Sales"]);

  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    message: "",
    target: "all", // all | employee | department
    targetValue: "",
  });

  const load = async () => {
    try {
      const [notiRes, empRes] = await Promise.all([
        api.get("/admin/notifications"),
        api.get("/admin/employees"),
      ]);

      setList(notiRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      console.error("❌ API Error:", err);
      alert("Không tải được dữ liệu");
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Gửi / cập nhật thông báo
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/admin/notifications/${editId}`, form);
        alert("✅ Cập nhật thông báo thành công");
      } else {
        await api.post("/admin/notifications", form);
        alert("✅ Gửi thông báo thành công");
      }

      setForm({ title: "", message: "", target: "all", targetValue: "" });
      setEditId(null);
      load();
    } catch (err) {
      console.error("❌ Lỗi lưu:", err);
      alert("❌ Không thể lưu thông báo");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa?")) return;

    try {
      await api.delete(`/admin/notifications/${id}`);
      alert("🗑️ Đã xóa thông báo");
      load();
    } catch (err) {
      console.error("❌ Lỗi xóa:", err);
      alert("❌ Không thể xóa thông báo");
    }
  };

  const startEdit = (n) => {
    setEditId(n._id);
    setForm({
      title: n.title,
      message: n.message,
      target: n.target,
      targetValue: n.targetValue || "",
    });
  };

  const fmtDate = (d) => new Date(d).toLocaleString("vi-VN");

  // =============================
  // UI
  // =============================
  return (
    <AdminLayout>
      <h2 className="mb-4">🔔 Quản lý thông báo</h2>

      {/* FORM TẠO / SỬA THÔNG BÁO */}
      <div className="card p-3 mb-4">
        <h5>{editId ? "✏️ Chỉnh sửa thông báo" : "➕ Gửi thông báo mới"}</h5>

        <form onSubmit={handleSubmit} className="mt-3">
          <div className="mb-2">
            <label className="form-label">Tiêu đề</label>
            <input
              type="text"
              className="form-control"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="mb-2">
            <label className="form-label">Nội dung</label>
            <textarea
              className="form-control"
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
          </div>

          <div className="mb-2">
            <label className="form-label">Gửi đến</label>
            <select
              className="form-control"
              value={form.target}
              onChange={(e) =>
                setForm({ ...form, target: e.target.value, targetValue: "" })
              }
            >
              <option value="all">Tất cả nhân viên</option>
              <option value="employee">Một nhân viên</option>
              <option value="department">Một phòng ban</option>
            </select>
          </div>

          {form.target === "employee" && (
            <div className="mb-2">
              <label className="form-label">Chọn nhân viên</label>
              <select
                className="form-control"
                value={form.targetValue}
                onChange={(e) =>
                  setForm({ ...form, targetValue: e.target.value })
                }
                required
              >
                <option value="">-- Chọn nhân viên --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp.userId?._id}>
                    {emp.name} ({emp.userId?.username})
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.target === "department" && (
            <div className="mb-2">
              <label className="form-label">Chọn phòng ban</label>
              <select
                className="form-control"
                value={form.targetValue}
                onChange={(e) =>
                  setForm({ ...form, targetValue: e.target.value })
                }
                required
              >
                <option value="">-- Chọn phòng ban --</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-3">
            <button className="btn btn-primary">
              {editId ? "💾 Lưu thay đổi" : "➕ Gửi thông báo"}
            </button>

            {editId && (
              <button
                type="button"
                className="btn btn-secondary ms-2"
                onClick={() => {
                  setEditId(null);
                  setForm({ title: "", message: "", target: "all", targetValue: "" });
                }}
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      {/* DANH SÁCH THÔNG BÁO */}
      <div className="card p-3">
        <h5>📑 Danh sách thông báo</h5>

        <table className="table table-bordered table-striped table-hover mt-2">
          <thead className="table-light">
            <tr>
              <th>Tiêu đề</th>
              <th>Nội dung</th>
              <th>Gửi đến</th>
              <th>Ngày gửi</th>
              <th style={{ width: 150 }}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {list.map((n) => (
              <tr key={n._id}>
                <td>{n.title}</td>
                <td>{n.message}</td>
                <td>
                  {n.target === "all"
                    ? "Tất cả"
                    : n.target === "employee"
                    ? `Nhân viên: ${n.targetValue}`
                    : `Phòng ban: ${n.targetValue}`}
                </td>
                <td>{fmtDate(n.createdAt)}</td>
                <td>
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={() => startEdit(n)}
                  >
                    Sửa
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(n._id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
