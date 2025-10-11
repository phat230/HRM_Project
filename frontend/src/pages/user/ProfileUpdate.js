// frontend/src/pages/user/ProfileUpdate.js
import React, { useEffect, useState } from "react";
import api from "../../api";
import SidebarMenu from "../../components/SidebarMenu";

export default function ProfileUpdate() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🧩 Lấy thông tin hiện tại
  const loadProfile = async () => {
    try {
      const res = await api.get("/employees/me"); // ✅ route chính xác
      setProfile(res.data);
      setName(res.data.name || "");
    } catch (err) {
      console.error("❌ Lỗi tải hồ sơ:", err);
      alert("Không thể tải thông tin cá nhân!");
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // 💾 Cập nhật tên hiển thị
  const saveName = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Tên hiển thị không được để trống!");
    setLoading(true);
    try {
      await api.put("/employees/profile", { name });
      alert("✅ Cập nhật tên hiển thị thành công!");
      await loadProfile();
    } catch (err) {
      console.error("❌ Lỗi cập nhật:", err);
      alert(err.response?.data?.error || "Không thể cập nhật thông tin!");
    } finally {
      setLoading(false);
    }
  };

  // 🔐 Đổi mật khẩu
  const changePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return alert("Vui lòng nhập đầy đủ mật khẩu!");
    setLoading(true);
    try {
      await api.put("/employees/change-password", { oldPassword, newPassword });
      alert("✅ Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      console.error("❌ Lỗi đổi mật khẩu:", err);
      alert(err.response?.data?.error || "Không thể đổi mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <div className="p-3 text-center">Đang tải thông tin...</div>;

  return (
    <div className="container-fluid mt-3">
      <div className="row">
        {/* Sidebar */}
        <div className="col-3">
          <SidebarMenu role="user" />
        </div>

        {/* Main content */}
        <div className="col-9">
          <h3 className="mb-3">👤 Cập nhật thông tin cá nhân</h3>

          {/* Chỉnh sửa tên hiển thị */}
          <div className="card mb-4">
            <div className="card-header bg-light">
              <strong>Đổi tên hiển thị</strong>
            </div>
            <div className="card-body">
              <form onSubmit={saveName}>
                <div className="mb-3">
                  <label className="form-label">Tên hiển thị</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-primary" disabled={loading}>
                  {loading ? "Đang lưu..." : "💾 Lưu thay đổi"}
                </button>
              </form>
            </div>
          </div>

          {/* Đổi mật khẩu */}
          <div className="card mb-4">
            <div className="card-header bg-light">
              <strong>Đổi mật khẩu</strong>
            </div>
            <div className="card-body">
              <form onSubmit={changePassword}>
                <div className="mb-3">
                  <label className="form-label">Mật khẩu cũ</label>
                  <input
                    type="password"
                    className="form-control"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Mật khẩu mới</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-warning" disabled={loading}>
                  {loading ? "Đang cập nhật..." : "🔐 Đổi mật khẩu"}
                </button>
              </form>
            </div>
          </div>

          {/* Thông tin tài khoản */}
          <div className="card">
            <div className="card-header bg-light">
              <strong>Thông tin tài khoản</strong>
            </div>
            <div className="card-body">
              <p>
                <strong>Tên đăng nhập:</strong> {profile.userId?.username}
              </p>
              <p>
                <strong>Chức vụ:</strong> {profile.userId?.role}
              </p>
              <p>
                <strong>Phòng ban:</strong> {profile.department || "—"}
              </p>
              <p>
                <strong>Vị trí:</strong> {profile.position || "—"}
              </p>
              <p>
                <strong>Ngày tạo:</strong>{" "}
                {new Date(profile.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
