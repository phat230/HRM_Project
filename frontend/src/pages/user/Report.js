// frontend/src/pages/user/Report.js
import React, { useEffect, useState } from "react";
import api from "../../api";
import SidebarMenu from "../../components/SidebarMenu";

export default function Report(){
  const [report, setReport] = useState(null);

  useEffect(() => {
    (async ()=>{
      // gợi ý: server tổng hợp từ Attendance, PerformanceReview, WorkSchedule -> trả về 1 object
      const res = await api.get("/report/me");
      setReport(res.data || {});
    })();
  },[]);

  return (
    <div className="container mt-3">
      <div className="row">
        <div className="col-3"><SidebarMenu role="user" /></div>
        <div className="col-9">
          <h3>📈 Báo cáo tổng hợp</h3>
          {!report ? <p>Đang tải...</p> : (
            <ul className="list-group">
              <li className="list-group-item">Tổng giờ làm: <strong>{report.totalHours || 0}</strong></li>
              <li className="list-group-item">Số nhiệm vụ đã hoàn thành: <strong>{report.tasksCompleted || 0}</strong></li>
              <li className="list-group-item">Điểm hiệu suất trung bình: <strong>{report.avgScore || 0}</strong></li>
              <li className="list-group-item">Tài liệu đã tải: <strong>{report.docsDownloaded || 0}</strong></li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
