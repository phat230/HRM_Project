// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);

  // load từ localStorage khi F5 hoặc mount app
  useEffect(() => {
    const saved = localStorage.getItem("authUser");
    if (saved) {
      try {
        setAuth(JSON.parse(saved));
      } catch {
        setAuth(null);
      }
    }
  }, []);

  const login = (data) => {
    const pack = {
      token: data.token,
      refreshToken: data.refreshToken,
      user: data.user,
    };

    localStorage.setItem("authUser", JSON.stringify(pack));
    setAuth(pack);
  };

  const logout = () => {
    localStorage.removeItem("authUser");
    setAuth(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ auth, user: auth?.user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
