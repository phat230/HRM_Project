// frontend/src/layouts/MainLayout.js
import React from "react";
import SidebarMenu from "../components/SidebarMenu";
import "./MainLayout.css";

export default function MainLayout({ role, children, title }) {
  return (
    <div className="main-layout">
      {/* Header */}
      <header className="topbar shadow-sm">
        <h4 className="m-0">{title || "Hệ thống quản lý nhân sự"}</h4>
      </header>

      <div className="layout-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <SidebarMenu role={role} />
        </aside>

        {/* Content */}
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
}
