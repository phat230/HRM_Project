import React, { useEffect, useState } from "react";
import api from "../../api";
import AdminLayout from "../../layouts/AdminLayout";

export default function PerformanceReviewAdmin() {
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    userId: "",
    tasksCompleted: 0,
    communication: 0,
    technical: 0,
    attitude: 10,
    feedback: "",
  });

  // Load dữ liệu
  const load = async () => {
    try {
      const res = await api.get("/admin/performance");
      const empRes = await api.get("/admin/employees");

      setReviews(res.data || []);
      setEmployees(empRes.data || []);
    } catch (err) {
      console.error("❌ API Error:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Thêm hoặc cập nhật
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/admin/performance/${editId}`, form);
        alert("✅ Cập nhật đánh giá thành công");
      } else {
        await api.post("/admin/performance", form);
        alert("✅ Đã thêm đánh giá");
      }

      setForm({
        userId: "",
        tasksCompleted: 0,
        communication: 0,
        technical: 0,
        attitude: 10,
        feedback: "",
      });
      setEditId(null);
      load();
    } catch (err) {
      console.error("❌ Lỗi thêm/cập nhật:", err);
      alert("❌ Không thể lưu đánh giá");
    }
  };

  // Xóa
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;

    try {
      await api.delete(`/admin/performance/${id}`);
      alert("🗑️ Đã xóa đánh giá");
      load();
    } catch (err) {
      console.error("❌ Lỗi xóa:", err);
      alert("❌ Không thể xóa đánh giá");
    }
  };

  // Sửa
  const startEdit = (r) => {
    setEditId(r._id);
    setForm({
      userId: r.userId?._id || "",
      tasksCompleted: r.tasksCompleted || 0,
      communication: r.communication || 0,
      technical: r.technical || 0,
      attitude: r.attitude || 10,
      feedback: r.feedback || "",
    });
  };

  return (
    <AdminLayout>
      <h2 className="mb-4">📊 Đánh giá hiệu suất</h2>

      {/* FORM */}
      <div className="card p-3 mb-4">
        <h5>{editId ? "✏️ Chỉnh sửa đánh giá" : "➕ Thêm đánh giá mới"}</h5>

        <form className="mt-3" onSubmit={handleSubmit}>
          {/* Nhân viên */}
          <label className="form-label">Nhân viên</label>
          <select
            className="form-control mb-2"
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
            required
          >
            <option value="">-- Chọn nhân viên --</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp.userId?._id}>
                {emp.name} ({emp.userId?.username})
              </option>
            ))}
          </select>

          {/* Tasks */}
          <label className="form-label">Hoàn thành nhiệm vụ (số lượng)</label>
          <input
            type="number"
            className="form-control mb-2"
            min="0"
            value={form.tasksCompleted}
            onChange={(e) =>
              setForm({ ...form, tasksCompleted: Number(e.target.value) })
            }
          />

          {/* Communication */}
          <label className="form-label">Kỹ năng giao tiếp</label>
          <select
            className="form-control mb-2"
            value={form.communication}
            onChange={(e) =>
              setForm({ ...form, communication: Number(e.target.value) })
            }
          >
            <option value="0">Không biết (0)</option>
            <option value="2">Kém (2)</option>
            <option value="4">Có thể giao tiếp (4)</option>
            <option value="6">Khá (6)</option>
            <option value="8">Tốt (8)</option>
            <option value="10">Giỏi (10)</option>
          </select>

          {/* Technical */}
          <label className="form-label">Kỹ năng kỹ thuật</label>
          <select
            className="form-control mb-2"
            value={form.technical}
            onChange={(e) =>
              setForm({ ...form, technical: Number(e.target.value) })
            }
          >
            <option value="0">Không biết (0)</option>
            <option value="2">Kém (2)</option>
            <option value="4">Cơ bản (4)</option>
            <option value="6">Khá (6)</option>
            <option value="8">Tốt (8)</option>
            <option value="10">Giỏi (10)</option>
          </select>

          {/* Attitude */}
          <label className="form-label">Thái độ / tinh thần</label>
          <select
            className="form-control mb-2"
            value={form.attitude}
            onChange={(e) =>
              setForm({ ...form, attitude: Number(e.target.value) })
            }
          >
            <option value="0">Tiêu cực (0)</option>
            <option value="10">Tích cực (10)</option>
          </select>

          {/* Feedback */}
          <label className="form-label">Nhận xét</label>
          <textarea
            className="form-control mb-2"
            value={form.feedback}
            onChange={(e) => setForm({ ...form, feedback: e.target.value })}
          />

          {/* Buttons */}
          <button className="btn btn-primary">
            {editId ? "💾 Lưu thay đổi" : "➕ Thêm đánh giá"}
          </button>

          {editId && (
            <button
              type="button"
              className="btn btn-secondary ms-2"
              onClick={() => {
                setEditId(null);
                setForm({
                  userId: "",
                  tasksCompleted: 0,
                  communication: 0,
                  technical: 0,
                  attitude: 10,
                  feedback: "",
                });
              }}
            >
              Hủy
            </button>
          )}
        </form>
      </div>

      {/* DANH SÁCH */}
      <div className="card p-3">
        <h5>📑 Danh sách đánh giá</h5>

        <table className="table table-bordered table-striped mt-2">
          <thead>
            <tr>
              <th>Nhân viên</th>
              <th>Nhiệm vụ</th>
              <th>Giao tiếp</th>
              <th>Kỹ thuật</th>
              <th>Thái độ</th>
              <th>Nhận xét</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {reviews.map((r) => (
              <tr key={r._id}>
                <td>{r.userId?.username}</td>
                <td>{r.tasksCompleted}</td>
                <td>{r.communication}</td>
                <td>{r.technical}</td>
                <td>{r.attitude}</td>
                <td>{r.feedback}</td>
                <td>
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={() => startEdit(r)}
                  >
                    Sửa
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(r._id)}
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
