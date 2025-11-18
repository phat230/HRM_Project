import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Protected({ children, roles }) {
  const { auth } = useAuth();

  // đang load từ localStorage
  if (auth === undefined) {
    return <div style={{ padding: 20 }}>Đang tải...</div>;
  }

  if (!auth || !auth.user) {
    return <Navigate to="/" replace />;
  }

  const user = auth.user;

  // kiểm tra quyền
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default Protected;
