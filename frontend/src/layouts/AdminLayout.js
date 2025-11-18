import React from "react";
import SidebarMenu from "../components/SidebarMenu";
import { useAuth } from "../context/AuthContext";
import "../styles/layout.css";

export default function AdminLayout({ children }) {
  const { auth } = useAuth();

  // chờ load localStorage
  if (auth === undefined) {
    return <div style={{ padding: 20 }}>Đang tải...</div>;
  }

  return (
    <div className="layout-container">
      <aside className="layout-sidebar">
        <SidebarMenu role={auth?.user?.role} />
      </aside>

      <main className="layout-content">{children}</main>
    </div>
  );
}
