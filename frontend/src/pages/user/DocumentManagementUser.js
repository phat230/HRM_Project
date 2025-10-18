import React, { useEffect, useState } from "react";
import api from "../../api";
import SidebarMenu from "../../components/SidebarMenu";

export default function DocumentManagementUser() {
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [currentUserDept, setCurrentUserDept] = useState(null);

  // ✅ Giải mã token lấy userId & role
  useEffect(() => {
    const token =
      localStorage.getItem("token") ||
      JSON.parse(localStorage.getItem("authUser") || "{}")?.token;

    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(decoded?.id);
        setCurrentRole(decoded?.role);
        console.log("✅ Token decoded:", decoded);
      } catch (err) {
        console.error("❌ Lỗi giải mã token:", err);
      }
    } else {
      console.warn("⚠️ Không tìm thấy token trong localStorage");
    }
  }, []);

  // ✅ Lấy thông tin phòng ban của user
  useEffect(() => {
    const fetchDept = async () => {
      try {
        // ⚠️ FIX: bỏ thừa /api
        const res = await api.get("/employees/me");
        setCurrentUserDept(res.data.department);
        console.log("🏢 Phòng ban user hiện tại:", res.data.department);
      } catch (err) {
        console.error("❌ Lỗi lấy phòng ban user:", err);
      }
    };
    fetchDept();
  }, []);

  // 📦 Lấy danh sách tài liệu
  const load = async () => {
    try {
      const res = await api.get("/employees/documents");
      setDocs(res.data || []);
      console.log("📄 Danh sách tài liệu:", res.data);
    } catch (err) {
      console.error("❌ Lỗi tải danh sách tài liệu:", err);
      alert(err.response?.data?.error || "Không thể tải danh sách tài liệu!");
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ⬇️ Tải tài liệu
  const downloadFile = async (id) => {
    try {
      const response = await api.get(`/employees/documents/download/${id}`, {
        responseType: "blob",
      });

      const disposition = response.headers["content-disposition"];
      let filename = "tai-lieu";
      if (disposition) {
        const utf8Match = disposition.match(/filename\*\=UTF-8''(.+)/);
        const normalMatch = disposition.match(/filename="(.+)"/);
        if (utf8Match && utf8Match[1]) {
          filename = decodeURIComponent(utf8Match[1]);
        } else if (normalMatch && normalMatch[1]) {
          filename = decodeURIComponent(normalMatch[1]);
        }
      }

      const contentType = response.headers["content-type"] || "application/octet-stream";
      const blob = new Blob([response.data], { type: contentType });
      const fileURL = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.error("❌ Lỗi tải file:", err);
      alert(err.response?.data?.error || "Không thể tải tài liệu!");
    }
  };

  // ⬆️ Upload tài liệu
  const uploadFile = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) return alert("Vui lòng nhập tiêu đề và chọn file!");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("file", file);

    try {
      setLoading(true);
      await api.post("/employees/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("✅ Tải tài liệu lên thành công!");
      setFile(null);
      setTitle("");
      await load();
    } catch (err) {
      console.error("❌ Lỗi tải lên:", err);
      alert(err.response?.data?.error || "Không thể tải lên tài liệu!");
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Xóa tài liệu
  const deleteFile = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa tài liệu này không?")) return;
    try {
      await api.delete(`/employees/documents/${id}`);
      alert("🗑️ Đã xóa tài liệu");
      await load();
    } catch (err) {
      console.error("❌ Lỗi xóa tài liệu:", err);
      alert(err.response?.data?.error || "Không thể xóa tài liệu!");
    }
  };

  // 📂 Lọc tài liệu trước khi render
  const visibleDocs = docs.filter((d) => {
    return d.department === "general" || d.department === currentUserDept;
  });

  return (
    <div className="container mt-3">
      <div className="row">
        {/* Sidebar */}
        <div className="col-3">
          <SidebarMenu role="user" />
        </div>

        {/* Nội dung chính */}
        <div className="col-9">
          <h3>📂 Tài liệu phòng ban của tôi</h3>

          {/* Upload form */}
          <form className="card p-3 mb-3" onSubmit={uploadFile}>
            <h5 className="mb-3">⬆️ Tải tài liệu lên</h5>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Nhập tiêu đề tài liệu..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <input
              type="file"
              className="form-control mb-2"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Đang tải lên..." : "📤 Tải lên"}
            </button>
          </form>

          {/* Danh sách tài liệu */}
          <div className="card p-3">
            <h5>📑 Danh sách tài liệu</h5>
            {visibleDocs.length === 0 ? (
              <p>Chưa có tài liệu nào.</p>
            ) : (
              <table className="table table-bordered table-hover mt-2">
                <thead className="table-light">
                  <tr>
                    <th>🏢 Phòng ban</th>
                    <th>📁 Thư mục</th>
                    <th>📄 File tài liệu</th>
                    <th>👤 Người tải lên</th>
                    <th className="text-center">⚙️ Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleDocs.map((d) => {
                    console.log(
                      "📄 File:", d.title,
                      "| 👤 uploadedBy:", d.uploadedBy?._id || d.uploadedBy,
                      "| 👤 currentUserId:", currentUserId,
                      "| 🏢 dept:", d.department,
                      "| 🏢 currentUserDept:", currentUserDept
                    );

                    const uploadedId = d.uploadedBy?._id || d.uploadedBy;
                    const isOwner = String(uploadedId) === String(currentUserId);
                    const isAdmin = currentRole === "admin";
                    const sameDept =
                      currentUserDept &&
                      d.department !== "general" &&
                      d.department === currentUserDept;

                    return (
                      <tr key={d._id}>
                        <td>{d.department}</td>
                        <td>{d.folder || "—"}</td>
                        <td>
                          <i className="bi bi-file-earmark-text me-2"></i>
                          {d.title}
                        </td>
                        <td>{d.uploadedBy?.username || "Không rõ"}</td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-success me-2"
                            onClick={() => downloadFile(d._id)}
                          >
                            ⬇️ Tải
                          </button>

                          {(isOwner || isAdmin || sameDept) && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => deleteFile(d._id)}
                            >
                              🗑️ Xóa
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
