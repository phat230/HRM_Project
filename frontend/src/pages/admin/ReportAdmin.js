import React, { useEffect, useState } from "react";
import api from "../../api";
import AdminLayout from "../../layouts/AdminLayout";

export default function ReportAdmin() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.get("/report");

      const cleanData = res.data.map((item) => {
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
    <AdminLayout>
      <h2 className="mb-4">📊 Báo cáo tổng hợp</h2>

      {loading && (
        <div className="alert alert-info">⏳ Đang tải dữ liệu...</div>
      )}

      {err && (
        <div className="alert alert-danger">{err}</div>
      )}

      {!loading && !err && (
        <div className="card p-3">
          <h5 className="mb-3">📑 Danh sách báo cáo</h5>

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
                  <td>{r.name} {r.username && `(${r.username})`}</td>
                  <td>{r.department}</td>
                  <td>{r.position}</td>
                  <td>{r.totalHours?.toFixed?.(2) || 0}</td>
                  <td>{r.totalLeaves || 0}</td>
                  <td>{r.avgScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
