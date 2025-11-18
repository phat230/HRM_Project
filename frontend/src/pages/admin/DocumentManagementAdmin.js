import React, { useEffect, useState } from "react";
import api from "../../api";
import axios from "axios";
import AdminLayout from "../../layouts/AdminLayout";

export default function DocumentManagementAdmin() {
  const [docs, setDocs] = useState([]);
  const [folders, setFolders] = useState([]);

  const [form, setForm] = useState({
    folder: "",
    department: "general",
    files: [],
  });

  // Tạo thư mục
  const [newFolder, setNewFolder] = useState("");
  const [newFolderDepartment, setNewFolderDepartment] = useState("general");

  // Load thư mục + tài liệu
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
      alert("Không thể tải dữ liệu");
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Tạo thư mục
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolder.trim()) return alert("Vui lòng nhập tên thư mục");

    try {
      await api.post("/admin/documents/folder", {
        folderName: newFolder.trim(),
        department: newFolderDepartment,
      });

      alert("Đã tạo thư mục thành công");
      setNewFolder("");
      setNewFolderDepartment("general");
      load();
    } catch (err) {
      console.error("❌ Lỗi:", err);
      alert("Không thể tạo thư mục");
    }
  };

  // Upload file
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.folder) return alert("Vui lòng chọn thư mục");
    if (!form.files || form.files.length === 0) return alert("Chưa chọn file");

    try {
      const fd = new FormData();
      fd.append("department", form.department);
      fd.append("folder", form.folder);

      for (let file of form.files) fd.append("file", file);

      await api.post("/admin/documents", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Upload thành công");
      setForm({ folder: "", department: "general", files: [] });
      load();
    } catch (err) {
      console.error("❌ Upload lỗi:", err);
      alert("Không thể upload");
    }
  };

  // Xóa file
  const handleDelete = async (id) => {
    if (!window.confirm("Xóa tài liệu này?")) return;

    try {
      await api.delete(`/admin/documents/${id}`);
      load();
    } catch (err) {
      console.error("❌", err);
      alert("Không thể xóa file");
    }
  };

  // Download file
  const handleDownload = async (id) => {
    try {
      const authUser = JSON.parse(localStorage.getItem("authUser"));
      const token = authUser?.token;

      const response = await axios.get(
        `http://localhost:5000/api/admin/documents/download/${id}`,
        {
          responseType: "blob",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Xác định tên file
      const disposition = response.headers["content-disposition"];
      let filename = "tai-lieu";
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="(.+)"/);
        if (match && match[1]) filename = decodeURIComponent(match[1]);
      }

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌", err);
      alert("Không thể tải file");
    }
  };

  return (
    <AdminLayout>
      <h2 className="mb-4">📂 Quản lý tài liệu</h2>

      {/* ==========================
         Tạo thư mục
      ========================== */}
      <div className="card p-3 mb-4">
        <h5 className="mb-3">📁 Tạo thư mục mới</h5>

        <div className="d-flex gap-3 flex-wrap">
          <div style={{ width: 250 }}>
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

          <div className="flex-grow-1">
            <label>Tên thư mục</label>
            <input
              className="form-control"
              placeholder="Nhập tên thư mục..."
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
            />
          </div>

          <div style={{ width: 150 }} className="d-flex align-items-end">
            <button className="btn btn-success w-100" onClick={handleCreateFolder}>
              ➕ Tạo
            </button>
          </div>
        </div>
      </div>

      {/* ==========================
         Upload tài liệu
      ========================== */}
      <div className="card p-3 mb-4">
        <h5 className="mb-3">📤 Upload tài liệu</h5>

        <div className="d-flex gap-3 flex-wrap">
          <div style={{ width: 250 }}>
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

          <div style={{ width: 250 }}>
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

          <div className="flex-grow-1">
            <label>Chọn file</label>
            <input
              type="file"
              multiple
              className="form-control"
              onChange={(e) => setForm({ ...form, files: e.target.files })}
            />
          </div>
        </div>

        <button className="btn btn-primary mt-3" onClick={handleSubmit}>
          📤 Upload
        </button>
      </div>

      {/* ==========================
         Danh sách tài liệu
      ========================== */}
      <div className="card p-3">
        <h5 className="mb-3">📑 Danh sách tài liệu</h5>

        {docs.length === 0 ? (
          <p className="text-muted">Chưa có tài liệu nào.</p>
        ) : (
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Phòng ban</th>
                <th>Thư mục</th>
                <th>File</th>
                <th>Người tải lên</th>
                <th className="text-center">Hành động</th>
              </tr>
            </thead>

            <tbody>
              {docs.map((d) => (
                <tr key={d._id}>
                  <td>{d.department}</td>
                  <td>{d.folder}</td>
                  <td>{d.title}</td>
                  <td>{d.uploadedBy?.username}</td>
                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-success me-2"
                      onClick={() => handleDownload(d._id)}
                    >
                      ⬇️
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(d._id)}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
