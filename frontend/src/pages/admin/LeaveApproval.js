import React, { useEffect, useState } from "react";
import api from "../../api";
import AdminLayout from "../../layouts/AdminLayout";

export default function LeaveApproval() {
  const [list, setList] = useState([]);

  const load = async () => {
    try {
      const res = await api.get("/admin/leave-requests");
      setList(res.data || []);
    } catch (err) {
      console.error("❌ Lỗi load nghỉ phép:", err.response?.data || err.message);
      alert("❌ Không tải được danh sách nghỉ phép");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (id, type) => {
    try {
      await api.put(`/admin/leave-requests/${id}/${type}`);
      load();
    } catch (err) {
      alert("❌ Lỗi cập nhật trạng thái");
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

  const calcDays = (from, to) => {
    if (!from || !to) return 0;
    const a = new Date(from);
    const b = new Date(to);
    return Math.round((b - a) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <AdminLayout>
      <h2 className="mb-4">📌 Phê duyệt nghỉ phép</h2>

      <div className="card p-3">
        <h5 className="mb-3">Danh sách yêu cầu nghỉ phép</h5>

        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Username</th>
                <th>Tên thật</th>
                <th>Phòng ban</th>
                <th>Chức vụ</th>
                <th>Từ ngày</th>
                <th>Đến ngày</th>
                <th>Số ngày</th>
                <th>Lý do</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th className="text-center" style={{ width: 180 }}>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {list.map((l) => (
                <tr key={l._id}>
                  
                  {/* 🔥 DÙNG FIELD BACKEND TRẢ VỀ */}
                  <td>{l.username}</td>
                  <td>{l.realName}</td>
                  <td>{l.department}</td>
                  <td>{l.position}</td>

                  {/* Ngày nghỉ */}
                  <td>{fmtDate(l.from)}</td>
                  <td>{fmtDate(l.to)}</td>

                  <td className="fw-bold text-primary">
                    {calcDays(l.from, l.to)} ngày
                  </td>

                  <td style={{ maxWidth: 200, whiteSpace: "pre-wrap" }}>
                    {l.reason}
                  </td>

                  <td>
                    {l.createdAt
                      ? new Date(l.createdAt).toLocaleString("vi-VN")
                      : "—"}
                  </td>

                  <td>
                    {l.status === "pending" && (
                      <span className="badge bg-warning text-dark">⏳ Chờ duyệt</span>
                    )}
                    {l.status === "approved" && (
                      <span className="badge bg-success">✅ Đã duyệt</span>
                    )}
                    {l.status === "rejected" && (
                      <span className="badge bg-danger">❌ Từ chối</span>
                    )}
                  </td>

                  <td className="text-center">
                    {l.status === "pending" ? (
                      <>
                        <button
                          className="btn btn-success btn-sm me-2"
                          onClick={() => act(l._id, "approve")}
                        >
                          Duyệt
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => act(l._id, "reject")}
                        >
                          Từ chối
                        </button>
                      </>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
