// frontend/src/components/SidebarMenu.js
import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/layout.css";

function SidebarMenu({ role }) {
  const { logout } = useContext(AuthContext);
  const { pathname } = useLocation();

  const active = (path) =>
    pathname === path ? "sidebar-item active" : "sidebar-item";

  return (
    <div>
      <div className="sidebar-header">HRM SYSTEM</div>

      {role === "admin" ? (
        <>
          <Link to="/admin/dashboard" className={active("/admin/dashboard")}>
            🏠 Dashboard
          </Link>
          <Link
            to="/admin/hr-management"
            className={active("/admin/hr-management")}
          >
            👨‍💼 Quản lý nhân sự
          </Link>
          <Link
            to="/admin/leave-approval"
            className={active("/admin/leave-approval")}
          >
            📌 Phê duyệt nghỉ phép
          </Link>
          <Link
            to="/admin/attendance-management"
            className={active("/admin/attendance-management")}
          >
            ⏱ Chấm công
          </Link>
          <Link
            to="/admin/salary-management"
            className={active("/admin/salary-management")}
          >
            💰 Lương
          </Link>
          <Link
            to="/admin/performance-review"
            className={active("/admin/performance-review")}
          >
            📊 Hiệu suất
          </Link>
          <Link
            to="/admin/document-management"
            className={active("/admin/document-management")}
          >
            📂 Tài liệu
          </Link>
          <Link
            to="/admin/work-schedule"
            className={active("/admin/work-schedule")}
          >
            📅 Lịch làm việc
          </Link>
          <Link
            to="/admin/notifications"
            className={active("/admin/notifications")}
          >
            🔔 Thông báo
          </Link>
          <Link to="/admin/reports" className={active("/admin/reports")}>
            📈 Báo cáo
          </Link>
          <Link to="/admin/chat" className={active("/admin/chat")}>
            💬 Chat
          </Link>
        </>
      ) : (
        <>
          <Link to="/user/dashboard" className={active("/user/dashboard")}>
            🏠 Dashboard
          </Link>
          <Link
            to="/user/profile-update"
            className={active("/user/profile-update")}
          >
            👤 Cập nhật thông tin
          </Link>
          <Link
            to="/user/leave-request"
            className={active("/user/leave-request")}
          >
            📌 Xin nghỉ phép
          </Link>
          <Link
            to="/user/leave-history"
            className={active("/user/leave-history")}
          >
            📜 Lịch sử nghỉ phép
          </Link>
          <Link to="/user/attendance" className={active("/user/attendance")}>
            ⏱ Chấm công
          </Link>
          <Link to="/user/chat" className={active("/user/chat")}>
            💬 Chat
          </Link>
          <Link to="/user/report" className={active("/user/report")}>
            📊 Báo cáo
          </Link>
          <Link
            to="/user/salary-management"
            className={active("/user/salary-management")}
          >
            💰 Lương
          </Link>
          <Link
            to="/user/performance-review"
            className={active("/user/performance-review")}
          >
            📊 Hiệu suất
          </Link>
          <Link
            to="/user/document-management"
            className={active("/user/document-management")}
          >
            📂 Tài liệu
          </Link>
          <Link
            to="/user/work-schedule"
            className={active("/user/work-schedule")}
          >
            📅 Lịch làm việc
          </Link>
          <Link
            to="/user/notifications"
            className={active("/user/notifications")}
          >
            🔔 Thông báo
          </Link>
        </>
      )}

      <button className="btn btn-outline-danger btn-logout" onClick={logout}>
        🚪 Đăng xuất
      </button>
    </div>
  );
}

export default SidebarMenu;
