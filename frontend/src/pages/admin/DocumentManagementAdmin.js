import React, { useEffect, useState } from "react";
import api from "../../api";
import axios from "axios"; // 🆕 thêm axios
import SidebarMenu from "../../components/SidebarMenu";

function DocumentManagementAdmin() {
  const [docs, setDocs] = useState([]);
  const [folders, setFolders] = useState([]);
  const [form, setForm] = useState({
    folder: "",
    department: "general",
    files: [],
  });

  // 🆕 state riêng cho phòng ban khi tạo thư mục
  const [newFolder, setNewFolder] = useState("");
  const [newFolderDepartment, setNewFolderDepartment] = useState("general");

  // 📦 Load danh sách file + folder
  const load = async () => {
    try {
      const [docsRes, foldersRes] = await Promise.all([
        api.get("/admin/documents"),
        api.get("/admin/documents/folders"),
      ]);
      setDocs(docsRes.data);
      setFolders(foldersRes.data);
    } catch (err) {
      console.error("❌ Lỗi tải dữ liệu:", err);
      alert("❌ Lỗi tải dữ liệu");
    }
  };

  useEffect(() => {
    load();
  }, []);

  // 📁 Tạo thư mục
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolder.trim()) return alert("⚠️ Vui lòng nhập tên thư mục");
    try {
      await api.post("/admin/documents/folder", {
        folderName: newFolder.trim(),
        department: newFolderDepartment,
      });
      alert(`✅ Đã tạo thư mục '${newFolder}'`);
      setNewFolder("");
      setNewFolderDepartment("general");
      load();
    } catch (err) {
      console.error("❌ Lỗi tạo thư mục:", err);
      alert("❌ Lỗi tạo thư mục");
    }
  };

  // 📤 Upload file
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.folder) return alert("⚠️ Vui lòng chọn thư mục");
    if (!form.files || form.files.length === 0) return alert("⚠️ Chưa chọn file");

    try {
      const fd = new FormData();
      fd.append("department", form.department);
      fd.append("folder", form.folder);
      for (let file of form.files) fd.append("file", file);

      await api.post("/admin/documents", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Upload thành công");
      setForm({ folder: "", department: "general", files: [] });
      load();
    } catch (err) {
      console.error("❌ Lỗi upload file:", err);
      alert("❌ Lỗi upload file");
    }
  };

  // 🗑️ Xóa file
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa tài liệu này?")) return;
    try {
      await api.delete(`/admin/documents/${id}`);
      load();
    } catch (err) {
      console.error("❌ Lỗi khi xóa file:", err);
      alert("❌ Lỗi khi xóa file");
    }
  };

 // ✅ Tải file với đúng đuôi
const handleDownload = async (id) => {
  try {
    const authUser = JSON.parse(localStorage.getItem("authUser"));
    const token = authUser?.token;

    const response = await axios.get(
      `http://localhost:5000/api/admin/documents/download/${id}`,
      {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // 📄 Lấy tên file từ Content-Disposition
    const disposition = response.headers["content-disposition"];
    let filename = "tai-lieu";
    if (disposition && disposition.indexOf("filename=") !== -1) {
      const match = disposition.match(/filename="(.+)"/);
      if (match && match[1]) filename = decodeURIComponent(match[1]);
    }

    // 🧾 Lấy MIME type chính xác từ header
    const contentType = response.headers["content-type"] || "application/octet-stream";

    // 📥 Tạo blob URL với đúng MIME
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
    alert("❌ Lỗi tải file");
  }
};


  return (
    <div className="container mt-3">
      <div className="row">
        <div className="col-3">
          <SidebarMenu role="admin" />
        </div>

        <div className="col-9">
          <h3>📂 Quản lý tài liệu</h3>

          {/* 📁 Tạo thư mục */}
          <form onSubmit={handleCreateFolder} className="card p-3 mb-3">
            <h5>📁 Tạo thư mục mới</h5>
            <div className="row">
              <div className="col-md-4 mb-2">
                <label>Phòng ban</label>
                <select
                  className="form-control"
                  value={newFolderDepartment}
                  onChange={(e) => setNewFolderDepartment(e.target.value)}
                >
                  <option value="general">Chung</option>
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div className="col-md-5 mb-2">
                <label>Tên thư mục</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tên thư mục..."
                  value={newFolder}
                  onChange={(e) => setNewFolder(e.target.value)}
                />
              </div>

              <div className="col-md-3 mb-2 d-flex align-items-end">
                <button className="btn btn-success w-100">➕ Tạo</button>
              </div>
            </div>
          </form>

          {/* 📤 Upload file */}
          <form onSubmit={handleSubmit} className="card p-3 mb-3">
            <h5>📤 Upload tài liệu</h5>
            <div className="row">
              <div className="col-md-4 mb-2">
                <label>Phòng ban</label>
                <select
                  className="form-control"
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value, folder: "" })
                  }
                >
                  <option value="general">Chung</option>
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div className="col-md-4 mb-2">
                <label>Thư mục</label>
                <select
                  className="form-control"
                  value={form.folder}
                  onChange={(e) => setForm({ ...form, folder: e.target.value })}
                >
                  <option value="">-- Chọn thư mục --</option>
                  {folders
                    .filter((f) => f.department === form.department)
                    .map((f) => (
                      <option key={f._id} value={f.title}>
                        {f.title}
                      </option>
                    ))}
                </select>
              </div>

              <div className="col-md-4 mb-2">
                <label>Chọn file</label>
                <input
                  type="file"
                  className="form-control"
                  multiple
                  onChange={(e) => setForm({ ...form, files: e.target.files })}
                />
              </div>
            </div>

            <button className="btn btn-primary mt-2">📤 Upload</button>
          </form>

          {/* 📑 Danh sách tài liệu */}
          <div className="card p-3">
            <h5>📑 Danh sách tài liệu</h5>
            {docs.length === 0 ? (
              <p>Chưa có tài liệu nào.</p>
            ) : (
              <table className="table table-bordered mt-2">
                <thead>
                  <tr>
                    <th>Phòng ban</th>
                    <th>Thư mục</th>
                    <th>File tài liệu</th>
                    <th>Người tải lên</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d) => (
                    <tr key={d._id}>
                      <td>{d.department}</td>
                      <td>{d.folder}</td>
                      <td>{d.title}</td>
                      <td>{d.uploadedBy?.username}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-success me-2"
                          onClick={() => handleDownload(d._id)}
                        >
                          ⬇️ Tải
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(d._id)}
                        >
                          🗑 Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentManagementAdmin;
