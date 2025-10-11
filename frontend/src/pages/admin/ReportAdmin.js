// frontend/src/pages/admin/ReportAdmin.js
import React, { useEffect, useState } from "react";
import api from "../../api";
import SidebarMenu from "../../components/SidebarMenu";

function ReportAdmin() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadReports = async () => {
    setLoading(true);
    try {
      // ✅ Gọi API đúng endpoint /report
      const res = await api.get("/report");

      // 👉 Chuyển đổi dữ liệu để chỉ lấy username, không hiển thị ID
      const cleanData = res.data.map((item) => {
        // Nếu item.username là ObjectId => để trống hoặc giữ nguyên username nếu có
        const username =
          typeof item.username === "object" ? "" : item.username;
        return { ...item, username };
      });

      setReports(cleanData);
    } catch (e) {
      console.error("❌ Lỗi tải báo cáo:", e);
      setErr(e.response?.data?.error || "Không tải được dữ liệu báo cáo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="container mt-3">
      <div className="row">
        <div className="col-3">
          <SidebarMenu role="admin" />
        </div>

        <div className="col-9">
          <h3>📊 Báo cáo tổng hợp</h3>

          {loading && <p>⏳ Đang tải dữ liệu...</p>}
          {err && <div className="alert alert-danger">{err}</div>}

          {!loading && !err && (
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Phòng ban</th>
                  <th>Chức vụ</th>
                  <th>Tổng giờ làm</th>
                  <th>Tổng ngày nghỉ</th>
                  <th>Hiệu suất TB</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, idx) => (
                  <tr key={idx}>
                    <td>
                      {/* ✅ Chỉ hiển thị tên và username, không hiển thị ID */}
                      {r.name} {r.username && `(${r.username})`}
                    </td>
                    <td>{r.department}</td>
                    <td>{r.position}</td>
                    <td>{r.totalHours?.toFixed?.(2) || 0}</td>
                    <td>{r.totalLeaves || 0}</td>
                    <td>{r.avgScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportAdmin;
