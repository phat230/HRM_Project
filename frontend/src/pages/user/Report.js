// src/pages/user/Report.js
import React, { useEffect, useState } from "react";
import api from "../../api";
import UserLayout from "../../layouts/UserLayout";
import { useAuth } from "../../context/AuthContext";

export default function Report() {
  const { user } = useAuth();        // 🔥 Lấy user thật
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🧩 Chỉ tải report khi user đã load từ AuthContext
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const res = await api.get("/report/me");
        setReport(res.data || {});
      } catch (err) {
        console.error("❌ Lỗi load báo cáo:", err);
        alert("Không thể tải báo cáo tổng hợp.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  // 🕒 Chờ user load xong → tránh văng khi role bị null lúc đầu
  if (!user) {
    return (
      <UserLayout>
        <div className="text-muted p-3 text-center">Đang tải người dùng...</div>
      </UserLayout>
    );
  }

  return (
    <UserLayout role={user.role}>   {/* 🔥 role chính xác */}
      <h2 className="mb-3">📈 Báo cáo tổng hợp</h2>

      {loading ? (
        <div className="text-muted">⏳ Đang tải dữ liệu...</div>
      ) : (
        <div className="row g-3">
          <div className="col-md-6">
            <div className="card p-3 shadow-sm">
              <div className="text-muted">Tổng giờ làm</div>
              <div className="fs-4 fw-bold text-primary">
                {report.totalHours || 0}
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card p-3 shadow-sm">
              <div className="text-muted">Nhiệm vụ hoàn thành</div>
              <div className="fs-4 fw-bold text-success">
                {report.tasksCompleted || 0}
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card p-3 shadow-sm">
              <div className="text-muted">Điểm hiệu suất TB</div>
              <div className="fs-4 fw-bold text-warning">
                {report.avgScore || 0}
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card p-3 shadow-sm">
              <div className="text-muted">Tài liệu đã tải</div>
              <div className="fs-4 fw-bold text-dark">
                {report.docsDownloaded || 0}
              </div>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
