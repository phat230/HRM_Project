// frontend/src/layouts/AdminLayout.js
import React from "react";
import SidebarMenu from "../components/SidebarMenu";
import "../styles/layout.css";

export default function AdminLayout({ children }) {
  return (
    <div className="layout-container">
      <aside className="layout-sidebar">
        <SidebarMenu role="admin" />
      </aside>

      <main className="layout-content">
        {children}
      </main>
    </div>
  );
}
