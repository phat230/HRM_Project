import React, { useEffect, useState } from "react";
import SidebarMenu from "../../components/SidebarMenu";
import api from "../../api";

function LeaveApproval() {
  const [list, setList] = useState([]);

  const load = async () => {
    try {
      const res = await api.get("/admin/leave-requests");
      setList(res.data);
    } catch (err) {
      console.error("❌ Lỗi load nghỉ phép:", err.response?.data || err.message);
      alert("❌ Không tải được danh sách nghỉ phép");
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (id, type) => {
    try {
      await api.put(`/admin/leave-requests/${id}/${type}`);
      load();
    } catch (err) {
      alert("❌ Lỗi cập nhật trạng thái");
    }
  };

  return (
    <div className="container mt-3">
      <div className="row">
        <div className="col-3"><SidebarMenu role="admin" /></div>
        <div className="col-9">
          <h3>📌 Phê duyệt nghỉ phép</h3>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Từ ngày</th>
                <th>Đến ngày</th>
                <th>Lý do</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {list.map(l => (
                <tr key={l._id}>
                  <td>{l.userId?.username}</td>
                  <td>{new Date(l.startDate).toLocaleDateString("vi-VN")}</td>
                  <td>{new Date(l.endDate).toLocaleDateString("vi-VN")}</td>
                  <td>{l.reason}</td>
                  <td>
                    {l.status === "pending" && <span className="badge bg-warning">⏳ Chờ duyệt</span>}
                    {l.status === "approved" && <span className="badge bg-success">✅ Đã duyệt</span>}
                    {l.status === "rejected" && <span className="badge bg-danger">❌ Từ chối</span>}
                  </td>
                  <td>
                    {l.status === "pending" && (
                      <>
                        <button className="btn btn-success btn-sm me-2" onClick={()=>act(l._id, "approve")}>Duyệt</button>
                        <button className="btn btn-danger btn-sm" onClick={()=>act(l._id, "reject")}>Từ chối</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default LeaveApproval;
