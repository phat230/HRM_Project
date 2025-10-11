import React, { useEffect, useState } from "react";
import api from "../../api";
import SidebarMenu from "../../components/SidebarMenu";

function Attendance() {
  const [records, setRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get("/attendance");
      setRecords(res.data);

      const today = new Date().toISOString().split("T")[0];
      const todayRec = res.data.find((r) => r.date === today);
      setTodayRecord(todayRec || null);
    } catch (err) {
      console.error("❌ Lỗi load chấm công:", err);
      alert("Lỗi tải dữ liệu chấm công!");
    } finally {
      setLoading(false);
    }
  };

  const checkIn = async () => {
    try {
      await api.post("/attendance/check-in");
      alert("✅ Check-in thành công");
      load();
    } catch (err) {
      alert(err.response?.data?.error || "❌ Lỗi check-in");
    }
  };

  const startOvertime = async () => {
    try {
      await api.post("/attendance/overtime");
      alert("✅ Bắt đầu tăng ca");
      load();
    } catch (err) {
      alert(err.response?.data?.error || "❌ Lỗi tăng ca");
    }
  };

  const endOvertime = async () => {
    try {
      await api.post("/attendance/overtime/checkout");
      alert("✅ Kết thúc tăng ca");
      load();
    } catch (err) {
      alert(err.response?.data?.error || "❌ Lỗi kết thúc tăng ca");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container mt-3">
      <div className="row">
        <div className="col-3">
          <SidebarMenu role="employee" />
        </div>
        <div className="col-9">
          <h3>🕒 Chấm công</h3>

          {/* Thông tin hôm nay */}
          {todayRecord ? (
            <div className="alert alert-info">
              <strong>📅 Hôm nay:</strong> {todayRecord.date} <br />
              ✅ Check-in:{" "}
              {todayRecord.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString() : "—"} <br />
              🕓 Check-out:{" "}
              {todayRecord.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString() : "—"} <br />
              ⏳ Đi trễ: {todayRecord.lateMinutes || 0} phút <br />
              ⏰ Tăng ca: {todayRecord.overtimeHours?.toFixed(2) || 0} giờ <br />
              📆 Ngày công: {todayRecord.totalDays || 0}
            </div>
          ) : (
            <p>📅 Bạn chưa chấm công hôm nay.</p>
          )}

          {/* Nút thao tác */}
          <div className="mb-3">
            <button
              className="btn btn-success me-2"
              onClick={checkIn}
              disabled={!!todayRecord?.checkIn}
            >
              ✅ Check-in
            </button>

            <button
              className="btn btn-warning me-2"
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

          {/* Bảng lịch sử */}
          {loading ? (
            <p>⏳ Đang tải dữ liệu...</p>
          ) : records.length === 0 ? (
            <p>Không có dữ liệu chấm công.</p>
          ) : (
            <table className="table table-bordered">
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
                    <td>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : "—"}</td>
                    <td>{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "—"}</td>
                    <td>{r.lateMinutes || 0}</td>
                    <td>{r.overtimeHours?.toFixed(2) || 0}</td>
                    <td>{r.totalDays || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Attendance;
