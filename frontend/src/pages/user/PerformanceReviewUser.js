// src/pages/user/PerformanceReviewUser.js
import React, { useEffect, useState } from "react";
import api from "../../api";
import UserLayout from "../../layouts/UserLayout";
import { useAuth } from "../../context/AuthContext";

export default function PerformanceReviewUser() {
  const { user } = useAuth(); // 🔥 lấy user thật từ context
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/employees/performance");
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
    // 🔒 Chỉ load khi đã có user (tránh chạy lúc context chưa khởi tạo)
    if (user) {
      load();
    }
  }, [user]);

  const calcScore = (r) => {
    const values = [
      r.tasksCompleted,
      r.communication,
      r.technical,
      r.attitude,
    ].filter((v) => typeof v === "number");
    if (values.length === 0) return 0;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  // Nếu user chưa có (context đang khởi tạo) thì show màn chờ nhẹ
  if (!user) {
    return (
      <UserLayout>
        <div className="p-3 text-center text-muted">
          Đang tải dữ liệu người dùng...
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout role={user.role}> {/* ✅ dùng đúng role hiện tại */}
      <h2 className="mb-3">📊 Đánh giá hiệu suất của tôi</h2>

      <div className="card p-3">
        {loading ? (
          <div className="text-center text-muted p-3">
            Đang tải dữ liệu...
          </div>
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
                    <td className="text-center fw-bold text-primary fs-5">
                      {calcScore(r)}
                    </td>
                    <td className="text-center">
                      {r.tasksCompleted ?? "—"}
                    </td>
                    <td className="text-center">
                      {r.communication ?? "—"}
                    </td>
                    <td className="text-center">
                      {r.technical ?? "—"}
                    </td>
                    <td className="text-center">
                      {r.attitude ?? "—"}
                    </td>
                    <td>{r.feedback || "Không có nhận xét"}</td>
                    <td>
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleString("vi-VN", {
                            hour12: false,
                          })
                        : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-3">
                    Chưa có đánh giá hiệu suất nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </UserLayout>
  );
}
