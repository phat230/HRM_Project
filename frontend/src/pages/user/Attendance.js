import React, { useEffect, useState } from "react";
import api from "../../api";
import UserLayout from "../../layouts/UserLayout";

function Attendance() {
  const [records, setRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get("/attendance");
      setRecords(res.data);

      const today = new Date().toISOString().split("T")[0];
      const findToday = res.data.find((r) => r.date === today);
      setTodayRecord(findToday || null);
    } catch (err) {
      console.error("❌ Load attendance error:", err);
      alert("❌ Không tải được dữ liệu chấm công");
    } finally {
      setLoading(false);
    }
  };

  const checkIn = async () => {
    try {
      await api.post("/attendance/check-in");
      alert("✅ Check-in thành công (Check-out mặc định 17:00)");
      load();
    } catch (err) {
      alert(err.response?.data?.error || "❌ Lỗi check-in");
    }
  };

  const startOvertime = async () => {
    try {
      await api.post("/attendance/overtime");
      alert("⏰ Bắt đầu tăng ca");
      load();
    } catch (err) {
      alert(err.response?.data?.error || "❌ Lỗi tăng ca");
    }
  };

  const endOvertime = async () => {
    try {
      await api.post("/attendance/overtime/checkout");
      alert("⏹ Kết thúc tăng ca");
      load();
    } catch (err) {
      alert(err.response?.data?.error || "❌ Lỗi kết thúc tăng ca");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const fmtTime = (t) =>
    t ? new Date(t).toLocaleTimeString("vi-VN", { hour12: false }) : "–";

  return (
    <UserLayout>
      <h2 className="mb-3">🕒 Chấm công</h2>

      {/* Khung hôm nay */}
      <div className="card p-3 mb-3">
        <h5 className="mb-2">📌 Thông tin chấm công hôm nay</h5>

        {todayRecord ? (
          <div>
            <p><strong>Ngày:</strong> {todayRecord.date}</p>
            <p><strong>Check-in:</strong> {fmtTime(todayRecord.checkIn)}</p>
            <p>
              <strong>Check-out:</strong>{" "}
              {todayRecord.checkOut ? fmtTime(todayRecord.checkOut) : "17:00 (mặc định)"}
            </p>
            <p><strong>Đi trễ:</strong> {todayRecord.lateMinutes || 0} phút</p>
            <p><strong>Tăng ca:</strong> {todayRecord.overtimeHours?.toFixed(2) || 0} giờ</p>
            <p><strong>Ngày công:</strong> {todayRecord.totalDays || 0}</p>
          </div>
        ) : (
          <div className="alert alert-warning mb-0">
            📅 Bạn chưa check-in hôm nay.
          </div>
        )}
      </div>

      {/* Nút thao tác */}
      <div className="card p-3 mb-3">
        <h5 className="mb-2">⚙️ Thao tác</h5>

        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-success"
            onClick={checkIn}
            disabled={!!todayRecord?.checkIn}
          >
            ✅ Check-in
          </button>

          <button
            className="btn btn-warning"
            onClick={startOvertime}
            disabled={!todayRecord?.checkIn || todayRecord?.overtimeStart}
          >
            ⏰ Bắt đầu tăng ca
          </button>

          <button
            className="btn btn-danger"
            onClick={endOvertime}
            disabled={!todayRecord?.overtimeStart}
          >
            ⏹ Kết thúc tăng ca
          </button>
        </div>
      </div>

      {/* Lịch sử */}
      <div className="card p-3">
        <h5>📋 Lịch sử chấm công</h5>

        {loading ? (
          <p>⏳ Đang tải...</p>
        ) : records.length === 0 ? (
          <p>Không có dữ liệu.</p>
        ) : (
          <table className="table table-bordered table-striped mt-2">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Giờ vào</th>
                <th>Giờ ra</th>
                <th>Đi trễ (phút)</th>
                <th>Tăng ca (giờ)</th>
                <th>Ngày công</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td>{r.date}</td>
                  <td>{fmtTime(r.checkIn)}</td>
                  <td>{r.checkOut ? fmtTime(r.checkOut) : "17:00"}</td>
                  <td>{r.lateMinutes || 0}</td>
                  <td>{r.overtimeHours?.toFixed(2) || 0}</td>
                  <td>{r.totalDays || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </UserLayout>
  );
}

export default Attendance;
