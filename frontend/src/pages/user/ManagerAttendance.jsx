// frontend/src/pages/user/ManagerAttendance.jsx
import React, { useEffect, useState } from "react";
import api from "../../api";

export default function ManagerAttendance() {
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get("/manager/group");
      setEmployees(res.data || []);
    } catch (err) {
      alert("Không tải được danh sách nhân viên bạn quản lý");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (userId) => {
    if (!userId) return;

    setSelected((prev) =>
      prev.includes(userId)
        ? prev.filter((x) => x !== userId)
        : [...prev, userId]
    );
  };

  const checkin = async () => {
    if (selected.length === 0)
      return alert("Chưa chọn nhân viên nào");

    try {
      await api.post("/attendance/bulk-checkin", { userIds: selected });
      alert("✔ Chấm công thành công!");
      setSelected([]);
      loadEmployees();
    } catch (err) {
      alert(err?.response?.data?.error || "Lỗi khi chấm công");
    }
  };

  return (
    <div className="card p-3">
      <h3 className="mb-3">🕒 Chấm công nhân viên dưới quyền</h3>

      {loading ? (
        <p>Đang tải danh sách...</p>
      ) : employees.length === 0 ? (
        <p>Chưa có nhân viên nào thuộc nhóm bạn quản lý.</p>
      ) : (
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th style={{ width: 50 }}></th>
              <th>Họ và tên</th>
              <th>Tài khoản</th>
              <th>Phòng ban</th>
            </tr>
          </thead>

          <tbody>
            {employees.map((emp) => {
              const uid = emp.userId?._id;

              return (
                <tr key={emp._id}>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={selected.includes(uid)}
                      onChange={() => toggleSelect(uid)}
                    />
                  </td>

                  <td>{emp.name || "Không rõ"}</td>
                  <td>{emp.userId?.username || "—"}</td>
                  <td>{emp.department || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {selected.length > 0 && (
        <button className="btn btn-primary mt-3" onClick={checkin}>
          ✔ Chấm công {selected.length} nhân viên
        </button>
      )}

      <style>
        {`
          table tbody tr:hover {
            background-color: #f8f9fa;
            cursor: pointer;
          }
        `}
      </style>
    </div>
  );
}
