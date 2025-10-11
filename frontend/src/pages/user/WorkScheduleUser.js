// src/pages/user/WorkScheduleUser.js
import React, { useEffect, useState } from "react";
import api from "../../api";
import SidebarMenu from "../../components/SidebarMenu";

function WorkScheduleUser() {
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
    <div className="container mt-3">
      <div className="row">
        <div className="col-3">
          <SidebarMenu role="employee" />
        </div>

        <div className="col-9">
          <h3>📅 Lịch làm việc của bạn</h3>

          {loading && <p>⏳ Đang tải dữ liệu...</p>}
          {!loading && err && (
            <div className="alert alert-danger">{err}</div>
          )}

          {!loading && !err && (
            <>
              {schedules.length === 0 ? (
                <p>Không có lịch làm việc nào.</p>
              ) : (
                <table className="table table-bordered">
                  <thead>
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkScheduleUser;
