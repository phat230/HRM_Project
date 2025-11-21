// SidebarMenu.js
import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/layout.css";

function SidebarMenu({ role }) {
  const { logout } = useContext(AuthContext);
  const { pathname, search } = useLocation();

  const active = (path) =>
    pathname + search === path ? "sidebar-item active" : "sidebar-item";

  return (
    <div>
      <div className="sidebar-header">HRM SYSTEM</div>

      {/* ================= ADMIN ================= */}
      {role === "admin" && (
        <>
          <Link className={active("/admin/dashboard")} to="/admin/dashboard">🏠 Dashboard</Link>
          <Link className={active("/admin/hr-management")} to="/admin/hr-management">👨‍💼 Quản lý nhân sự</Link>
          <Link className={active("/admin/leave-approval")} to="/admin/leave-approval">📌 Phê duyệt nghỉ phép</Link>
          <Link className={active("/admin/attendance-management")} to="/admin/attendance-management">⏱ Chấm công</Link>
          <Link className={active("/admin/salary-management")} to="/admin/salary-management">💰 Lương</Link>
          <Link className={active("/admin/performance-review")} to="/admin/performance-review">📊 Hiệu suất</Link>
          <Link className={active("/admin/document-management")} to="/admin/document-management">📂 Tài liệu</Link>
          <Link className={active("/admin/work-schedule")} to="/admin/work-schedule">📅 Lịch làm việc</Link>
          <Link className={active("/admin/notifications")} to="/admin/notifications">🔔 Thông báo</Link>
          <Link className={active("/admin/reports")} to="/admin/reports">📈 Báo cáo</Link>
          <Link className={active("/admin/chat")} to="/admin/chat">💬 Chat</Link>
        </>
      )}

      {/* ================= EMPLOYEE + MANAGER ================= */}
      {role !== "admin" && (
        <>
          <Link className={active("/user/dashboard")} to="/user/dashboard">🏠 Dashboard</Link>
          <Link className={active("/user/profile-update")} to="/user/profile-update">👤 Cập nhật thông tin</Link>
          <Link className={active("/user/leave-request")} to="/user/leave-request">📌 Xin nghỉ phép</Link>
          <Link className={active("/user/leave-history")} to="/user/leave-history">📜 Lịch sử nghỉ phép</Link>

          {/* CHẤM CÔNG CÁ NHÂN */}
          <Link className={active("/user/attendance")} to="/user/attendance">⏱ Chấm công</Link>

          {/* ⭐ MANAGER EXTRA MENU ⭐ */}
          {role === "manager" && (
            <>
              <Link className={active("/user/manage-group")} to="/user/manage-group">
                👥 Nhóm nhân viên
              </Link>

              <Link
                className={active("/user/attendance?tab=manage")}
                to="/user/attendance?tab=manage"
              >
                🕒 Chấm công nhân viên
              </Link>
            </>
          )}

          <Link className={active("/user/chat")} to="/user/chat">💬 Chat</Link>
          <Link className={active("/user/report")} to="/user/report">📊 Báo cáo</Link>
          <Link className={active("/user/salary-management")} to="/user/salary-management">💰 Lương</Link>
          <Link className={active("/user/performance-review")} to="/user/performance-review">📊 Hiệu suất</Link>
          <Link className={active("/user/document-management")} to="/user/document-management">📂 Tài liệu</Link>
          <Link className={active("/user/work-schedule")} to="/user/work-schedule">📅 Lịch làm việc</Link>
          <Link className={active("/user/notifications")} to="/user/notifications">🔔 Thông báo</Link>
        </>
      )}

      <button className="btn btn-outline-danger btn-logout" onClick={logout}>
        🚪 Đăng xuất
      </button>
    </div>
  );
}

export default SidebarMenu;
