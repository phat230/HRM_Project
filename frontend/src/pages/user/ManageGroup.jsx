import React, { useEffect, useState } from "react";
import UserLayout from "../../layouts/UserLayout";
import api from "../../api";

export default function ManageGroup() {
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [group, setGroup] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Lấy nhân viên cùng phòng ban
      const deptRes = await api.get("/manager/department-employees");

      // Lấy nhân viên thuộc nhóm manager
      const groupRes = await api.get("/manager/group");

      setDepartmentEmployees(deptRes.data || []);
      setGroup(groupRes.data || []);
    } catch (err) {
      alert("Không thể tải danh sách nhân viên!");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addToGroup = async () => {
    if (selected.length === 0) return alert("Chưa chọn nhân viên nào");

    try {
      await api.post("/manager/group/add", {
        employeeIds: selected
      });

      alert("✔ Đã thêm nhân viên vào nhóm");

      setSelected([]);
      loadData(); // Reload lại danh sách
    } catch (err) {
      alert(err?.response?.data?.error || "Lỗi khi thêm nhân viên vào nhóm");
    }
  };

  return (
    <UserLayout>
      <h2 className="mb-3">👥 Quản lý nhóm nhân viên</h2>

      {/* =================== DANH SÁCH NHÂN VIÊN CÙNG PHÒNG BAN =================== */}
      <div className="card p-3 mb-4">
        <h5>Nhân viên cùng phòng ban</h5>
        <p className="text-muted mb-2">Chọn nhân viên để thêm vào nhóm bạn quản lý.</p>

        {loading ? (
          <p>Đang tải...</p>
        ) : departmentEmployees.length === 0 ? (
          <p>Không có nhân viên nào.</p>
        ) : (
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th style={{ width: 50 }}></th>
                <th>Họ tên</th>
                <th>Tài khoản</th>
                <th>Phòng ban</th>
              </tr>
            </thead>
            <tbody>
              {departmentEmployees.map((emp) => (
                <tr key={emp._id}>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={selected.includes(emp._id)}
                      onChange={() => toggleSelect(emp._id)}
                    />
                  </td>
                  <td>{emp.name || "Không rõ"}</td>
                  <td>{emp.userId?.username || "—"}</td>
                  <td>{emp.department || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {selected.length > 0 && (
          <button className="btn btn-primary mt-3" onClick={addToGroup}>
            ✔ Thêm {selected.length} nhân viên vào nhóm
          </button>
        )}
      </div>

      {/* =================== NHÓM NHÂN VIÊN ĐANG QUẢN LÝ =================== */}
      <div className="card p-3">
        <h5>Nhân viên bạn quản lý</h5>

        {loading ? (
          <p>Đang tải...</p>
        ) : group.length === 0 ? (
          <p>Chưa có nhân viên nào trong nhóm.</p>
        ) : (
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Tài khoản</th>
                <th>Phòng ban</th>
              </tr>
            </thead>
            <tbody>
              {group.map((emp) => (
                <tr key={emp._id}>
                  <td>{emp.name || "Không rõ"}</td>
                  <td>{emp.userId?.username || "—"}</td>
                  <td>{emp.department || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>
        {`
          table tbody tr:hover {
            background-color: #f8f9fa;
          }
        `}
      </style>
    </UserLayout>
  );
}
