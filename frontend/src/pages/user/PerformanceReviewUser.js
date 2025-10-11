// frontend/src/pages/user/PerformanceReviewUser.js
import React, { useEffect, useState } from "react";
import api from "../../api";
import SidebarMenu from "../../components/SidebarMenu";

export default function PerformanceReviewUser() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Hàm tải dữ liệu đánh giá của chính nhân viên
  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/employees/performance"); // ✅ endpoint đúng cho user
      setList(res.data || []);
    } catch (err) {
      console.error("❌ Lỗi tải dữ liệu hiệu suất:", err);
      alert(err.response?.data?.error || "Không thể tải dữ liệu hiệu suất!");
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // 🔹 Hàm tính tổng điểm trung bình
  const calcScore = (r) => {
    const values = [r.tasksCompleted, r.communication, r.technical, r.attitude].filter(
      (v) => typeof v === "number"
    );
    if (values.length === 0) return 0;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  return (
    <div className="container mt-3">
      <div className="row">
        {/* Sidebar */}
        <div className="col-3">
          <SidebarMenu role="user" />
        </div>

        {/* Nội dung chính */}
        <div className="col-9">
          <h3 className="mb-3">📊 Đánh giá hiệu suất của tôi</h3>

          {loading ? (
            <div className="text-center text-muted p-3">Đang tải dữ liệu...</div>
          ) : (
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "12%" }}>Tổng điểm</th>
                  <th style={{ width: "12%" }}>Nhiệm vụ</th>
                  <th style={{ width: "12%" }}>Giao tiếp</th>
                  <th style={{ width: "12%" }}>Kỹ thuật</th>
                  <th style={{ width: "12%" }}>Thái độ</th>
                  <th style={{ width: "32%" }}>Nhận xét</th>
                  <th style={{ width: "18%" }}>Ngày đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {list.length > 0 ? (
                  list.map((r) => (
                    <tr key={r._id}>
                      <td className="text-center fw-bold text-primary">{calcScore(r)}</td>
                      <td className="text-center">{r.tasksCompleted ?? "—"}</td>
                      <td className="text-center">{r.communication ?? "—"}</td>
                      <td className="text-center">{r.technical ?? "—"}</td>
                      <td className="text-center">{r.attitude ?? "—"}</td>
                      <td>{r.feedback || "Không có nhận xét"}</td>
                      <td>
                        {new Date(r.createdAt).toLocaleString("vi-VN", {
                          hour12: false,
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-muted">
                      Chưa có đánh giá hiệu suất nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
