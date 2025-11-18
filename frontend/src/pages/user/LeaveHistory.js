import React, { useEffect, useState } from "react";
import api from "../../api";
import UserLayout from "../../layouts/UserLayout";
import { useAuth } from "../../context/AuthContext";

export default function LeaveHistory() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Hook PHẢI ĐỨNG TRÊN RETURN
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/leave-requests/me");
        setList(res.data || []);
      } catch (err) {
        console.error("❌ Lỗi load lịch sử nghỉ phép:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (!user) {
    return (
      <UserLayout>
        <div className="p-3 text-center">Đang tải dữ liệu...</div>
      </UserLayout>
    );
  }

  const fmt = (d) => new Date(d).toLocaleDateString("vi-VN");

  const statusBadge = (st) => {
    switch (st) {
      case "approved":
        return <span className="badge bg-success">Đã duyệt</span>;
      case "rejected":
        return <span className="badge bg-danger">Từ chối</span>;
      default:
        return <span className="badge bg-warning text-dark">Chờ duyệt</span>;
    }
  };

  return (
    <UserLayout role={user.role}>
      <h2 className="mb-3">📜 Lịch sử nghỉ phép</h2>

      <div className="card p-3">
        {loading ? (
          <p className="text-muted">⏳ Đang tải dữ liệu...</p>
        ) : list.length === 0 ? (
          <p className="text-muted">Không có lịch sử nghỉ phép.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-striped align-middle">
              <thead className="table-light">
                <tr>
                  <th>Từ ngày</th>
                  <th>Đến ngày</th>
                  <th>Lý do</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {list.map((l) => (
                  <tr key={l._id}>
                    <td>{fmt(l.from)}</td>
                    <td>{fmt(l.to)}</td>
                    <td>{l.reason}</td>
                    <td>{statusBadge(l.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
