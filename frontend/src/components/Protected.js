// src/components/Protected.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Protected({ children, roles }) {
  let { user } = useAuth();

  // nếu chưa load xong từ localStorage → chờ
  if (user === undefined) return null;

  // fallback localStorage
  if (!user) {
    const saved = localStorage.getItem("authUser");
    if (saved) {
      try {
        user = JSON.parse(saved).user;
      } catch {}
    }
  }

  if (!user) return <Navigate to="/" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default Protected;
