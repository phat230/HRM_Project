import React, { useEffect, useState } from "react";
import api from "../../api";
import SidebarMenu from "../../components/SidebarMenu";

function WorkScheduleAdmin() {
  const [list, setList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    task: "",
    department: "",
    assignedTo: "",
    startDate: "",
    endDate: "",
  });

  // Load lịch + nhân viên
  const load = async () => {
    try {
      const res = await api.get("/admin/work-schedule");
      setList(res.data);

      const empRes = await api.get("/admin/employees");
      setEmployees(empRes.data);
    } catch (err) {
      console.error("❌ API Error:", err.response?.data || err.message);
      alert("❌ Không tải được dữ liệu");
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Khi chọn nhân viên → tự động lấy phòng ban
  const handleEmployeeChange = (e) => {
    const userId = e.target.value;
    const emp = employees.find((emp) => emp.userId?._id === userId);
    setForm({
      ...form,
      assignedTo: userId,
      department: emp?.department || "",
    });
  };

  // Thêm / cập nhật lịch
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/admin/work-schedule/${editId}`, form);
        alert("✅ Cập nhật lịch thành công");
      } else {
        await api.post("/admin/work-schedule", form);
        alert("✅ Thêm lịch thành công");
      }
      setForm({ task: "", department: "", assignedTo: "", startDate: "", endDate: "" });
      setEditId(null);
      load();
    } catch (err) {
      console.error("❌ Lỗi thêm/cập nhật:", err.response?.data || err.message);
      alert("❌ Không thể lưu lịch");
    }
  };

  // Xóa
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa?")) return;
    try {
      await api.delete(`/admin/work-schedule/${id}`);
      alert("🗑️ Đã xóa lịch");
      load();
    } catch (err) {
      console.error("❌ Lỗi xóa:", err.response?.data || err.message);
      alert("❌ Không thể xóa");
    }
  };

  // Sửa
  const startEdit = (w) => {
    setEditId(w._id);
    setForm({
      task: w.task || "",
      department: w.department || "",
      assignedTo: w.assignedTo?._id || "",
      startDate: w.startDate ? w.startDate.split("T")[0] : "",
      endDate: w.endDate ? w.endDate.split("T")[0] : "",
    });
  };

  return (
    <div className="container mt-3">
      <div className="row">
        <div className="col-3">
          <SidebarMenu role="admin" />
        </div>
        <div className="col-9">
          <h3>📅 Quản lý lịch làm việc</h3>

          {/* Form thêm/sửa */}
          <form onSubmit={handleSubmit} className="mb-3">
            <div className="mb-2">
              <label className="form-label">Nhiệm vụ</label>
              <input
                type="text"
                className="form-control"
                value={form.task || ""}
                onChange={(e) => setForm({ ...form, task: e.target.value })}
                required
              />
            </div>

            <div className="mb-2">
              <label className="form-label">Nhân viên</label>
              <select
                className="form-control"
                value={form.assignedTo || ""}
                onChange={handleEmployeeChange}
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

            <div className="mb-2">
              <label className="form-label">Phòng ban</label>
              <input
                type="text"
                className="form-control"
                value={form.department || ""}
                readOnly
              />
            </div>

            <div className="row">
              <div className="col">
                <label className="form-label">Ngày bắt đầu</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.startDate || ""}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="col">
                <label className="form-label">Ngày kết thúc</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.endDate || ""}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <button className="btn btn-primary mt-3">
              {editId ? "💾 Lưu thay đổi" : "➕ Thêm lịch"}
            </button>
            {editId && (
              <button
                type="button"
                className="btn btn-secondary mt-3 ms-2"
                onClick={() => {
                  setEditId(null);
                  setForm({ task: "", department: "", assignedTo: "", startDate: "", endDate: "" });
                }}
              >
                Hủy
              </button>
            )}
          </form>

          {/* Danh sách */}
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Nhiệm vụ</th>
                <th>Phòng ban</th>
                <th>Nhân viên</th>
                <th>Bắt đầu</th>
                <th>Kết thúc</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {list.map((w) => (
                <tr key={w._id}>
                  <td>{w.task}</td>
                  <td>{w.department}</td>
                  <td>{w.assignedTo?.username}</td>
                  <td>{new Date(w.startDate).toLocaleDateString("vi-VN")}</td>
                  <td>{new Date(w.endDate).toLocaleDateString("vi-VN")}</td>
                  <td>
                    <button className="btn btn-warning btn-sm me-2" onClick={() => startEdit(w)}>
                      Sửa
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(w._id)}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default WorkScheduleAdmin;
