import React, { useState } from "react";
import SidebarMenu from "../../components/SidebarMenu";
import api from "../../api";

function LeaveRequest() {
  const [form, setForm] = useState({ from: "", to: "", reason: "" });

  const onSubmit = async (e) => {
    e.preventDefault();
    await api.post("/leave-requests", form);
    alert("Đã gửi đơn nghỉ phép");
    setForm({ from: "", to: "", reason: "" });
  };

  return (
    <div className="container mt-3">
      <div className="row">
        <div className="col-3"><SidebarMenu role="user" /></div>
        <div className="col-9">
          <h3>📌 Xin nghỉ phép</h3>
          <form onSubmit={onSubmit}>
            <div className="row g-2">
              <div className="col">
                <label>Từ ngày</label>
                <input type="date" className="form-control" value={form.from}
                  onChange={(e)=>setForm({...form, from: e.target.value})} />
              </div>
              <div className="col">
                <label>Đến ngày</label>
                <input type="date" className="form-control" value={form.to}
                  onChange={(e)=>setForm({...form, to: e.target.value})} />
              </div>
            </div>
            <label className="mt-2">Lý do</label>
            <textarea className="form-control mb-3" value={form.reason}
              onChange={(e)=>setForm({...form, reason: e.target.value})} />
            <button className="btn btn-primary">Gửi</button>
          </form>
        </div>
      </div>
    </div>
  );
}
export default LeaveRequest;
