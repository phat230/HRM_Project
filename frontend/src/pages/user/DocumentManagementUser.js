import React, { useEffect, useState } from "react";
import api from "../../api";
import UserLayout from "../../layouts/UserLayout";
import { useAuth } from "../../context/AuthContext";

export default function DocumentManagementUser() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUserDept, setCurrentUserDept] = useState(null);

  const currentUserId = user?.id;
  const currentRole = user?.role;

  // ❌ KHÔNG ĐƯỢC ĐỂ RETURN TRƯỚC HOOK
  // ---------- HOOKS PHẢI ĐỂ Ở ĐÂY ----------

  useEffect(() => {
    const loadDept = async () => {
      try {
        const res = await api.get("/employees/me");
        setCurrentUserDept(res.data.department);
      } catch (err) {
        console.error("❌ Lỗi load department:", err);
      }
    };
    loadDept();
  }, []);

  const loadDocs = async () => {
    try {
      const res = await api.get("/employees/documents");
      setDocs(res.data || []);
    } catch (err) {
      console.error("❌ Lỗi load documents:", err);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  // ---------- SAU KHI HOOK MỚI ĐƯỢC RETURN ----------
  if (!user) {
    return (
      <UserLayout>
        <div className="text-center p-3">Đang tải dữ liệu...</div>
      </UserLayout>
    );
  }

  const downloadFile = async (id) => {
    try {
      const response = await api.get(`/employees/documents/download/${id}`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data]);
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute("download", "tai-lieu");
      link.click();
    } catch (err) {
      console.error("❌ Error download:", err);
    }
  };

  const uploadFile = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) return alert("Thiếu thông tin!");
    const formData = new FormData();
    formData.append("title", title);
    formData.append("file", file);

    try {
      setLoading(true);
      await api.post("/employees/documents", formData);
      setTitle("");
      setFile(null);
      loadDocs();
    } catch (err) {
      console.error("❌ Error upload:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (id) => {
    if (!window.confirm("Xóa tài liệu này?")) return;
    try {
      await api.delete(`/employees/documents/${id}`);
      loadDocs();
    } catch (err) {
      console.error("❌ Error delete:", err);
    }
  };

  const visibleDocs = docs.filter(
    (d) => d.department === "general" || d.department === currentUserDept
  );

  return (
    <UserLayout role={user.role}>
      <h2 className="mb-3">📂 Tài liệu của tôi</h2>

      <div className="card p-3 mb-4">
        <h5 className="mb-3">⬆️ Upload tài liệu</h5>

        <form onSubmit={uploadFile}>
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Tiêu đề tài liệu..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            type="file"
            className="form-control mb-2"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Đang tải..." : "Tải lên"}
          </button>
        </form>
      </div>

      <div className="card p-3">
        <h5>📑 Danh sách tài liệu</h5>

        <table className="table table-bordered mt-3">
          <thead>
            <tr>
              <th>Phòng ban</th>
              <th>Thư mục</th>
              <th>Tiêu đề</th>
              <th>Người tải lên</th>
              <th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {visibleDocs.map((d) => {
              const isOwner = String(d.uploadedBy?._id) === String(currentUserId);
              const canDelete = isOwner || currentRole === "admin";

              return (
                <tr key={d._id}>
                  <td>{d.department}</td>
                  <td>{d.folder || "—"}</td>
                  <td>{d.title}</td>
                  <td>{d.uploadedBy?.username}</td>
                  <td className="text-center">
                    <button
                      className="btn btn-success btn-sm me-2"
                      onClick={() => downloadFile(d._id)}
                    >
                      ⬇️
                    </button>

                    {canDelete && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteFile(d._id)}
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </UserLayout>
  );
}
