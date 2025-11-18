import React, { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import api from "../../api";

export default function AttendanceManagementAdmin() {
  const [list, setList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [checked, setChecked] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({
    checkIn: "",
    checkOut: "",
    lateMinutes: 0,
    overtimeHours: 0,
    totalDays: 1,
    date: "",
  });

  // ==== TÍNH TRỄ ====
  const calcLate = (checkInStr) => {
    if (!checkInStr) return 0;
    const d = new Date(checkInStr);
    const mins = d.getHours() * 60 + d.getMinutes();
    return Math.max(0, mins - 7 * 60);
  };

  // ==== TÍNH GIỜ VÀO TỪ PHÚT TRỄ ====
  const calcCheckInFromLate = (dateStr, late) => {
    if (!dateStr) return "";
    const base = new Date(dateStr);
    base.setHours(7, 0, 0, 0);
    base.setMinutes(base.getMinutes() + (late || 0));
    return base.toISOString().slice(0, 16);
  };

  // ==== TÍNH OT ====
  const calcOT = (checkOutStr) => {
    if (!checkOutStr) return 0;
    const d = new Date(checkOutStr);
    const mins = d.getHours() * 60 + d.getMinutes();
    const diff = mins - 17 * 60;
    return diff > 0 ? (diff / 60).toFixed(2) : 0;
  };

  // ==== LOAD DATA ====
  const load = async () => {
    try {
      const params = selectedDate ? { date: selectedDate } : {};
      const res = await api.get("/attendance", { params });
      setList(res.data);

      const emp = await api.get("/admin/employees");
      setEmployees(
        emp.data.sort((a, b) =>
          (a.userId?.username || "").localeCompare(b.userId?.username || "")
        )
      );
    } catch (err) {
      console.error(err);
      alert("Không tải được dữ liệu");
    }
  };

  // ==== FIX useEffect ====
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        if (isMounted) await load();
      } catch {}
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  const fmtTime = (t) =>
    t ? new Date(t).toLocaleTimeString("vi-VN", { hour12: false }) : "–";

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("vi-VN") : "–";

  const toggleCheck = (uid) => {
    setChecked((p) =>
      p.includes(uid) ? p.filter((x) => x !== uid) : [...p, uid]
    );
  };

  const bulkCheckIn = async () => {
    if (!checked.length) return alert("Chưa chọn nhân viên");

    const today = new Date().toISOString().split("T")[0];

    if (selectedDate && selectedDate !== today) {
      if (!window.confirm("Chấm công sẽ tính cho NGÀY HÔM NAY. Tiếp tục?"))
        return;
    }

    if (!window.confirm(`Xác nhận chấm công cho ${checked.length} nhân viên?`))
      return;

    try {
      await api.post("/attendance/bulk-checkin", { userIds: checked });
      alert("✔ Đã chấm công");
      setChecked([]);
      setSelectedDate(today);
    } catch (err) {
      alert(err.response?.data?.error || "Không thể chấm công");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Xoá bản ghi này?")) return;
    await api.delete(`/attendance/manual/${id}`);
    load();
  };

  const openEdit = (rec) => {
    setEditing(rec);
    setEditData({
      checkIn: rec.checkIn ? new Date(rec.checkIn).toISOString().slice(0, 16) : "",
      checkOut: rec.checkOut ? new Date(rec.checkOut).toISOString().slice(0, 16) : "",
      lateMinutes: rec.lateMinutes,
      overtimeHours: rec.overtimeHours,
      totalDays: rec.totalDays,
      date: rec.date,
    });
  };

  const saveEdit = async () => {
    try {
      await api.put(`/attendance/manual/${editing._id}`, editData);
      alert("✔ Đã cập nhật!");
      setEditing(null);
      load();
    } catch (err) {
      alert("Không thể lưu thay đổi");
    }
  };

  // ==== RENDER BODY ====
  const renderBody = () => {
    if (selectedDate) {
      if (!list.length)
        return (
          <tr>
            <td colSpan={10} className="text-center text-muted">
              Không có dữ liệu
            </td>
          </tr>
        );

      return list.map((r) => (
        <tr key={r._id}>
          <td>
            <input
              type="checkbox"
              checked={checked.includes(r.userId?._id)}
              onChange={() => toggleCheck(r.userId?._id)}
            />
          </td>
          <td>{r.userId?.username}</td>
          <td>{fmtDate(r.date)}</td>
          <td>{fmtTime(r.checkIn)}</td>
          <td>{fmtTime(r.checkOut)}</td>
          <td>{r.lateMinutes}</td>
          <td>{r.overtimeHours}</td>
          <td>{r.totalDays}</td>
          <td>
            <button className="btn btn-warning btn-sm me-2" onClick={() => openEdit(r)}>
              ✏️ Sửa
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => remove(r._id)}>
              🗑 Xoá
            </button>
          </td>
        </tr>
      ));
    }

    return employees.map((emp) => {
      const rec = list.find((x) => x.userId?._id === emp.userId?._id);

      return (
        <tr key={emp._id}>
          <td>
            <input
              type="checkbox"
              checked={checked.includes(emp.userId?._id)}
              onChange={() => toggleCheck(emp.userId?._id)}
            />
          </td>
          <td>{emp.userId?.username}</td>
          <td>{fmtDate(rec?.date)}</td>
          <td>{fmtTime(rec?.checkIn)}</td>
          <td>{fmtTime(rec?.checkOut)}</td>
          <td>{rec?.lateMinutes ?? 0}</td>
          <td>{rec?.overtimeHours ?? 0}</td>
          <td>{rec?.totalDays ?? 0}</td>
          <td>
            {rec?._id && (
              <>
                <button className="btn btn-warning btn-sm me-2" onClick={() => openEdit(rec)}>
                  ✏️ Sửa
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(rec._id)}>
                  🗑 Xoá
                </button>
              </>
            )}
          </td>
        </tr>
      );
    });
  };

  return (
    <AdminLayout>
      <h2 className="mb-3">⏱ Quản lý chấm công</h2>

      <div className="d-flex gap-3 mb-3">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="form-control"
          style={{ width: 180 }}
        />

        <button
          className="btn btn-outline-primary"
          onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
        >
          Hôm nay
        </button>

        <button className="btn btn-secondary" onClick={() => setSelectedDate("")}>
          Xem tất cả
        </button>
      </div>

      <div className="d-flex gap-2 mb-3">
        <button
          className="btn btn-success"
          disabled={!checked.length}
          onClick={bulkCheckIn}
        >
          ✔ Chấm công ngay ({checked.length})
        </button>

        <button className="btn btn-secondary" onClick={() => setChecked([])}>
          Bỏ chọn
        </button>
      </div>

      <div className="card p-3">
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th></th>
              <th>Nhân viên</th>
              <th>Ngày</th>
              <th>Giờ vào</th>
              <th>Ra</th>
              <th>Trễ (phút)</th>
              <th>OT (giờ)</th>
              <th>Công</th>
              <th></th>
            </tr>
          </thead>
          <tbody>{renderBody()}</tbody>
        </table>
      </div>

      {editing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div className="card p-4" style={{ width: 420 }}>
            <h4 className="mb-3">✏️ Sửa chấm công</h4>

            <label>Giờ vào</label>
            <input
              type="datetime-local"
              className="form-control mb-2"
              value={editData.checkIn}
              onChange={(e) => {
                const v = e.target.value;
                setEditData({
                  ...editData,
                  checkIn: v,
                  lateMinutes: calcLate(v),
                });
              }}
            />

            <label>Giờ ra</label>
            <input
              type="datetime-local"
              className="form-control mb-2"
              value={editData.checkOut}
              onChange={(e) => {
                const v = e.target.value;
                setEditData({
                  ...editData,
                  checkOut: v,
                  overtimeHours: calcOT(v),
                });
              }}
            />

            <label>Đi trễ (phút)</label>
            <input
              type="number"
              className="form-control mb-2"
              value={editData.lateMinutes}
              onChange={(e) => {
                const lm = Number(e.target.value);
                setEditData({
                  ...editData,
                  lateMinutes: lm,
                  checkIn: calcCheckInFromLate(editData.date, lm),
                });
              }}
            />

            <label>OT (giờ)</label>
            <input
              disabled
              type="number"
              className="form-control mb-2"
              value={editData.overtimeHours}
              readOnly
            />

            <label>Công</label>
            <select
              className="form-control mb-3"
              value={editData.totalDays}
              onChange={(e) =>
                setEditData({ ...editData, totalDays: Number(e.target.value) })
              }
            >
              <option value={0}>0 — Không công</option>
              <option value={1}>1 — Đủ công</option>
            </select>

            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>
                Huỷ
              </button>
              <button className="btn btn-primary" onClick={saveEdit}>
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
