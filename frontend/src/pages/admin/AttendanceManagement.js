// frontend/src/pages/admin/AttendanceManagementAdmin.js
import React, { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import api from "../../api";

export default function AttendanceManagementAdmin() {
  const [list, setList] = useState([]);

  const load = async () => {
    try {
      const res = await api.get("/attendance");
      const sorted = res.data.sort((a, b) =>
        (a.userId?.username || "").localeCompare(b.userId?.username || "")
      );
      setList(sorted);
    } catch (err) {
      console.error("❌ Lỗi tải chấm công:", err);
      alert("Không tải được dữ liệu chấm công");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatTime = (timeStr) => {
    if (!timeStr) return "–";
    return new Date(timeStr).toLocaleTimeString("vi-VN", { hour12: false });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "–";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  return (
    <AdminLayout>
      <h2 className="mb-3">⏱ Quản lý chấm công</h2>

      <div className="card p-3">
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th>Nhân viên</th>
              <th>Ngày</th>
              <th>Giờ Check-in</th>
              <th>Đi trễ (phút)</th>
              <th>Tăng ca (giờ)</th>
              <th>Ngày công</th>
            </tr>
          </thead>
          <tbody>
            {list.length > 0 ? (
              list.map((a) => (
                <tr key={a._id}>
                  <td>{a.userId?.username || "—"}</td>
                  <td>{formatDate(a.date)}</td>
                  <td>{formatTime(a.checkIn)}</td>
                  <td>{a.lateMinutes ?? 0}</td>
                  <td>{a.overtimeHours?.toFixed(2) ?? 0}</td>
                  <td>{a.totalDays ?? 0}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center text-muted">
                  Không có dữ liệu chấm công
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
