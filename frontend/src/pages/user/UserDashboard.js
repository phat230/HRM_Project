import React from "react";
import SidebarMenu from "../../components/SidebarMenu";

function UserDashboard() {
  return (
    <div className="container mt-3">
      <div className="row">
        <div className="col-3"><SidebarMenu role="user" /></div>
        <div className="col-9">
          <h3>🏠 User Dashboard</h3>
          <p>Xin chào! Dùng menu bên trái để thao tác.</p>
        </div>
      </div>
    </div>
  );
}
export default UserDashboard;
