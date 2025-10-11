import React, { useEffect, useState } from "react";
import SidebarMenu from "../../components/SidebarMenu";
import api from "../../api";

function AttendanceManagement() {
  const [list, setList] = useState([]);

  const load = async () => {
    try {
      const res = await api.get("/attendance");
      // Sắp xếp theo username để dễ nhìn
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
    const d = new Date(timeStr);
    return d.toLocaleTimeString("vi-VN", { hour12: false });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "–";
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN");
  };

  return (
    <div className="container mt-3">
      <div className="row">
        {/* Sidebar */}
        <div className="col-3">
          <SidebarMenu role="admin" />
        </div>

        {/* Main content */}
        <div className="col-9">
          <h3>⏱ Quản lý chấm công</h3>
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
                    <td>{a.userId?.username || "–"}</td>
                    <td>{formatDate(a.date)}</td>
                    <td>{formatTime(a.checkIn)}</td>
                    <td>{a.lateMinutes ?? 0}</td>
                    <td>{a.overtimeHours?.toFixed(2) ?? 0}</td>
                    <td>{a.totalDays ?? 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center">
                    Không có dữ liệu
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

export default AttendanceManagement;
