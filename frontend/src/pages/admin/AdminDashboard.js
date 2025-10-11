import React from "react";
import SidebarMenu from "../../components/SidebarMenu";

function AdminDashboard() {
  return (
    <div className="container mt-3">
      <div className="row">
        <div className="col-3"><SidebarMenu role="admin" /></div>
        <div className="col-9">
          <h3>📊 Admin Dashboard</h3>
          <p>Chào mừng Admin! Dùng menu bên trái để quản lý.</p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
