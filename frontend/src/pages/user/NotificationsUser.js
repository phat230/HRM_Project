import React, { useEffect, useState } from "react";
import api from "../../api";
import SidebarMenu from "../../components/SidebarMenu";

function Notifications() {
  const [notis, setNotis] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get("/notifications");
      setNotis(res.data);
    } catch (err) {
      console.error("❌ Lỗi load thông báo:", err);
      alert("Không thể tải thông báo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container mt-3">
      <div className="row">
        {/* Sidebar */}
        <div className="col-3">
          <SidebarMenu role="employee" />
        </div>

        {/* Nội dung */}
        <div className="col-9">
          <h3>📢 Thông báo</h3>

          {loading ? (
            <p>⏳ Đang tải dữ liệu...</p>
          ) : notis.length === 0 ? (
            <p>Không có thông báo nào.</p>
          ) : (
            <div className="list-group">
              {notis.map((n) => (
                <div key={n._id} className="list-group-item">
                  <h5 className="mb-1">{n.title}</h5>
                  <p className="mb-1">{n.message}</p>
                  <small>
                    👤 {n.createdBy?.username || "Hệ thống"} —{" "}
                    {new Date(n.createdAt).toLocaleString()}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notifications;
