import React from "react";
import AdminLayout from "../../layouts/AdminLayout";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <h2>🏠 Dashboard (Admin)</h2>

      <div className="card p-3 mt-3">
        <p>Chào mừng bạn đến với hệ thống quản trị HRM.</p>
      </div>
    </AdminLayout>
  );
}
