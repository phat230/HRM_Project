import React, { useEffect, useState } from "react";
import SidebarMenu from "../../components/SidebarMenu";
import api from "../../api";
import { DEPARTMENTS, POSITIONS, ROLES } from "../../config/constants";

function HRManagement() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    department: "",
    position: "",
    role: "employee",
  });
  const [editId, setEditId] = useState(null);

  const load = async () => {
    try {
      const res = await api.get("/admin/employees");
      setList(res.data);
    } catch (err) {
      alert("❌ Lỗi tải danh sách nhân viên");
    }
  };

  useEffect(() => { load(); }, []);

  // Thêm nhân viên
  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/admin/employees/${editId}`, form);
        alert("✅ Cập nhật nhân viên thành công");
      } else {
        await api.post("/admin/employees", form);
        alert("✅ Thêm nhân viên thành công");
      }
      setForm({ username: "", password: "", name: "", department: "", position: "", role: "employee" });
      setEditId(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "❌ Lỗi");
    }
  };

  // Chỉnh sửa nhân viên
  const onEdit = (emp) => {
    setEditId(emp._id);
    setForm({
      username: emp.userId?.username,
      password: "", // không show password
      name: emp.name,
      department: emp.department,
      position: emp.position,
      role: emp.userId?.role,
    });
  };

  // Xóa nhân viên
  const onDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) return;
    try {
      await api.delete(`/admin/employees/${id}`);
      alert("🗑️ Đã xóa nhân viên");
      load();
    } catch (err) {
      alert("❌ Lỗi khi xóa");
    }
  };

  return (
    <div className="container mt-3">
      <div className="row">
        <div className="col-3"><SidebarMenu role="admin" /></div>
        <div className="col-9">
          <h3>👨‍💼 Quản lý nhân sự</h3>

          {/* Form thêm/sửa nhân viên */}
          <form onSubmit={onSubmit} className="mb-4 border p-3 rounded">
            <h5>{editId ? "✏️ Chỉnh sửa nhân viên" : "➕ Thêm nhân viên mới"}</h5>

            <div className="row g-2 mt-2">
              <div className="col">
                <input
                  className="form-control"
                  placeholder="Username"
                  value={form.username}
                  disabled={!!editId}
                  onChange={(e)=>setForm({...form, username: e.target.value})}
                  required
                />
              </div>
              {!editId && (
                <div className="col">
                  <input
                    className="form-control"
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={(e)=>setForm({...form, password: e.target.value})}
                    required
                  />
                </div>
              )}
            </div>

            <div className="row g-2 mt-2">
              <div className="col">
                <input
                  className="form-control"
                  placeholder="Họ tên"
                  value={form.name}
                  onChange={(e)=>setForm({...form, name: e.target.value})}
                  required
                />
              </div>
              <div className="col">
                <select
                  className="form-control"
                  value={form.department}
                  onChange={(e)=>setForm({...form, department: e.target.value})}
                  required
                >
                  <option value="">-- Chọn phòng ban --</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="col">
                <select
                  className="form-control"
                  value={form.position}
                  onChange={(e)=>setForm({...form, position: e.target.value})}
                  required
                >
                  <option value="">-- Chọn chức vụ --</option>
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="row g-2 mt-2">
              <div className="col">
                <select
                  className="form-control"
                  value={form.role}
                  onChange={(e)=>setForm({...form, role: e.target.value})}
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="col">
                <button className="btn btn-primary w-100">
                  {editId ? "Cập nhật" : "Thêm nhân viên"}
                </button>
              </div>
              {editId && (
                <div className="col">
                  <button
                    type="button"
                    className="btn btn-secondary w-100"
                    onClick={() => {
                      setEditId(null);
                      setForm({ username: "", password: "", name: "", department: "", position: "", role: "employee" });
                    }}
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* Danh sách nhân viên */}
          <h5>📋 Danh sách nhân viên</h5>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Họ tên</th>
                <th>Phòng ban</th>
                <th>Chức vụ</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {list.map(e => (
                <tr key={e._id}>
                  <td>{e.userId?.username}</td>
                  <td>{e.userId?.role}</td>
                  <td>{e.name}</td>
                  <td>{e.department}</td>
                  <td>{e.position}</td>
                  <td>
                    <button className="btn btn-sm btn-warning me-2" onClick={()=>onEdit(e)}>Sửa</button>
                    <button className="btn btn-sm btn-danger" onClick={()=>onDelete(e._id)}>Xóa</button>
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

export default HRManagement;
