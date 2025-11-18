import React, { useEffect, useState } from "react";
import api from "../../api";
import UserLayout from "../../layouts/UserLayout";

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get("/attendance");
      setRecords(res.data);
    } catch (err) {
      alert("Không tải được dữ liệu chấm công");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("vi-VN") : "–";

  const fmtTime = (t) =>
    t ? new Date(t).toLocaleTimeString("vi-VN", { hour12: false }) : "–";

  return (
    <UserLayout>
      <h2 className="mb-3">🕒 Lịch sử chấm công</h2>

      <div className="card p-3">
        {loading ? (
          <p>Đang tải...</p>
        ) : records.length === 0 ? (
          <p>Không có dữ liệu.</p>
        ) : (
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Giờ vào</th>
                <th>Giờ ra</th>
                <th>Đi trễ (phút)</th>
                <th>Tăng ca (giờ)</th>
                <th>Ngày công</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td>{fmtDate(r.date)}</td>
                  <td>{fmtTime(r.checkIn)}</td>
                  <td>{fmtTime(r.checkOut)}</td>
                  <td>{r.lateMinutes || 0}</td>
                  <td>{r.overtimeHours?.toFixed(2) || 0}</td>
                  <td>{r.totalDays || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </UserLayout>
  );
}
