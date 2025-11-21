import React, { useEffect, useState } from "react";
import api from "../../api";
import UserLayout from "../../layouts/UserLayout";
import { useAuth } from "../../context/AuthContext";
import ManagerAttendance from "./ManagerAttendance";
import { useLocation } from "react-router-dom";

export default function Attendance() {
  const { user } = useAuth();
  const role = user?.role;

  const { search } = useLocation();
  const query = new URLSearchParams(search);
  const defaultTab = query.get("tab") === "manage" ? "manage" : "self";

  const [tab, setTab] = useState(defaultTab);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== "manager" || tab === "self") loadAttendance();
  }, [tab, role]);

  const loadAttendance = async () => {
    try {
      const res = await api.get("/attendance");
      setRecords(res.data || []);
    } catch {
      alert("Không tải được dữ liệu chấm công");
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "–");
  const fmtTime = (t) =>
    t ? new Date(t).toLocaleTimeString("vi-VN", { hour12: false }) : "–";

  return (
    <UserLayout>
      <h2 className="mb-3">⏱ Chấm công</h2>

      {role === "manager" && (
        <div className="mb-4">
          <button
            className={`btn me-2 ${
              tab === "self" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setTab("self")}
          >
            📘 Lịch sử của tôi
          </button>

          <button
            className={`btn ${
              tab === "manage" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setTab("manage")}
          >
            🕒 Chấm công nhân viên
          </button>
        </div>
      )}

      {/* Tab quản lý nhân viên */}
      {role === "manager" && tab === "manage" && <ManagerAttendance />}

      {/* Tab lịch sử cá nhân */}
      {(role !== "manager" || tab === "self") && (
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
      )}
    </UserLayout>
  );
}
