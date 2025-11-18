import React, { useEffect, useState } from "react";
import api from "../../api";
import UserLayout from "../../layouts/UserLayout";
import { useAuth } from "../../context/AuthContext";

export default function NotificationsUser() {
  const { user } = useAuth();
  const [notis, setNotis] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 HOOK LUÔN ĐỨNG TRÊN RETURN
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/notifications");
        setNotis(res.data || []);
      } catch (err) {
        console.error("❌ Lỗi load thông báo:", err);
        alert("Không thể tải thông báo.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // RETURN ĐƯỢC ĐẶT SAU HOOKS
  if (!user) {
    return (
      <UserLayout>
        <div className="p-3 text-center">Đang tải dữ liệu...</div>
      </UserLayout>
    );
  }

  return (
    <UserLayout role={user.role}>
      <h2 className="mb-3">📢 Thông báo</h2>

      <div className="card p-3">
        {loading ? (
          <p>⏳ Đang tải...</p>
        ) : notis.length === 0 ? (
          <p className="text-muted">Không có thông báo nào.</p>
        ) : (
          <div className="list-group">
            {notis.map((n) => (
              <div key={n._id} className="list-group-item list-group-item-action">
                <div className="d-flex justify-content-between">
                  <h5>{n.title}</h5>
                  <small>{new Date(n.createdAt).toLocaleString("vi-VN")}</small>
                </div>
                <p className="mb-1">{n.message}</p>
                <small className="text-muted">
                  👤 {n.createdBy?.username || "Hệ thống"}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
