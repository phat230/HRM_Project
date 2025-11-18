import React, { useEffect, useState } from "react";
import api from "../../api";
import UserLayout from "../../layouts/UserLayout";
import { useAuth } from "../../context/AuthContext";

export default function WorkScheduleUser() {
  const { user } = useAuth(); // 🔥 Lấy đúng role thật
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/work-schedule");
      setSchedules(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("❌ Lỗi tải lịch làm việc:", e);
      setErr(e.response?.data?.error || "Không tải được lịch làm việc.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <UserLayout role={user?.role}> {/* 🔥 Sửa tại đây */}
      <h2 className="mb-3">📅 Lịch làm việc của tôi</h2>

      {loading && <div className="text-muted">⏳ Đang tải dữ liệu...</div>}
      {!loading && err && <div className="alert alert-danger">{err}</div>}

      {!loading && !err && (
        <>
          {schedules.length === 0 ? (
            <div className="alert alert-info">Không có lịch làm việc nào.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Nhiệm vụ</th>
                    <th>Phòng ban</th>
                    <th>Người được giao</th>
                    <th>Ngày bắt đầu</th>
                    <th>Ngày kết thúc</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s._id}>
                      <td>{s.task || "—"}</td>
                      <td>{s.department || "—"}</td>
                      <td>{s.assignedTo?.username || "—"}</td>
                      <td>
                        {s.startDate
                          ? new Date(s.startDate).toLocaleDateString("vi-VN")
                          : "—"}
                      </td>
                      <td>
                        {s.endDate
                          ? new Date(s.endDate).toLocaleDateString("vi-VN")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </UserLayout>
  );
}
