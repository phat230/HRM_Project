// frontend/src/layouts/UserLayout.js
import React from "react";
import SidebarMenu from "../components/SidebarMenu";
import { useAuth } from "../context/AuthContext";
import "../styles/layout.css";

export default function UserLayout({ children }) {
  const { user } = useAuth();   // 🔥 Lấy đúng role từ context

  return (
    <div className="layout-container">
      <aside className="layout-sidebar">
        <SidebarMenu role={user?.role} />  {/* 🔥 Truyền role chính xác */}
      </aside>

      <main className="layout-content">
        {children}
      </main>
    </div>
  );
}
