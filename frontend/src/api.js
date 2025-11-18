// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || "http://localhost:5000/api",
});

// thêm token vào request
api.interceptors.request.use((config) => {
  const s = localStorage.getItem("authUser");
  if (s) {
    try {
      const { token } = JSON.parse(s);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {}
  }
  return config;
});

// tự refresh token khi 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // nếu token hết hạn
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const saved = localStorage.getItem("authUser");
      if (!saved) return Promise.reject(error);

      const { refreshToken } = JSON.parse(saved);

      try {
        const res = await axios.post("http://localhost:5000/api/auth/refresh", {
          refreshToken,
        });

        const pack = {
          token: res.data.token,
          refreshToken: res.data.refreshToken,
          user: JSON.parse(saved).user,
        };

        localStorage.setItem("authUser", JSON.stringify(pack));
        api.defaults.headers.Authorization = `Bearer ${res.data.token}`;
        original.headers.Authorization = `Bearer ${res.data.token}`;

        return api(original);
      } catch (err) {
        localStorage.removeItem("authUser");
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
