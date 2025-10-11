import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Protected({ children, roles }) {
  const { user } = useContext(AuthContext);

  // 🔑 Nếu context chưa có user thì fallback từ localStorage
  let currentUser = user;
  if (!currentUser) {
    const authUser = localStorage.getItem("authUser");
    if (authUser) {
      try {
        const parsed = JSON.parse(authUser);
        currentUser = parsed.user;
      } catch (err) {
        console.error("❌ Lỗi parse authUser:", err);
      }
    }
  }

  // 🚫 Nếu không có user sau khi fallback → quay về login
  if (!currentUser) return <Navigate to="/" replace />;

  // 🧭 Nếu có roles và không khớp role của user → cấm truy cập
  if (roles && !roles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default Protected;
