import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function SidebarMenu({ role }) {
  const { logout } = useContext(AuthContext);
  return (
    <div className="list-group">
      {role === "admin" ? (
        <>
          <Link to="/admin/dashboard" className="list-group-item">🏠 Dashboard</Link>
          <Link to="/admin/hr-management" className="list-group-item">👨‍💼 Quản lý nhân sự</Link>
          <Link to="/admin/leave-approval" className="list-group-item">📌 Phê duyệt nghỉ phép</Link>
          <Link to="/admin/salary-management" className="list-group-item">💰 Quản lý lương</Link>
          <Link to="/admin/attendance-management" className="list-group-item">⏱ Quản lý chấm công</Link>
          <Link to="/admin/performance-review" className="list-group-item">📊 Đánh giá hiệu suất</Link>
          <Link to="/admin/document-management" className="list-group-item">📂 Quản lý tài liệu</Link>
          <Link to="/admin/work-schedule" className="list-group-item">📅 Lịch làm việc</Link>
          <Link to="/admin/notifications" className="list-group-item">🔔 Thông báo</Link>
          <Link to="/admin/reports" className="list-group-item">📊 Báo cáo tổng hợp</Link>
          <Link to="/admin/chat" className="list-group-item">💬 Chat</Link>
        </>
      ) : (
        <>
          <Link to="/user/dashboard" className="list-group-item">🏠 Dashboard</Link>
          <Link to="/user/profile-update" className="list-group-item">👤 Cập nhật thông tin</Link>
          <Link to="/user/leave-request" className="list-group-item">📌 Xin nghỉ phép</Link>
          <Link to="/user/leave-history" className="list-group-item">📜 Lịch sử nghỉ phép</Link>
          <Link to="/user/attendance" className="list-group-item">⏱ Chấm công</Link>
          <Link to="/user/chat" className="list-group-item">💬 Chat</Link>
          <Link to="/user/report" className="list-group-item">📊 Báo cáo</Link>
          <Link to="/user/salary-management" className="list-group-item">💰 Lương</Link>
          <Link to="/user/performance-review" className="list-group-item">📊 Hiệu suất</Link>
          <Link to="/user/document-management" className="list-group-item">📂 Tài liệu</Link>
          <Link to="/user/work-schedule" className="list-group-item">📅 Lịch làm việc</Link>
          <Link to="/user/notifications" className="list-group-item">🔔 Thông báo</Link>
        </>
      )}

      <button onClick={logout} className="list-group-item list-group-item-action mt-3">
        🚪 Đăng xuất
      </button>
    </div>
  );
}

export default SidebarMenu;
