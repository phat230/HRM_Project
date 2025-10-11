import React, { useEffect, useState } from "react";
import api from "../../api";
import SidebarMenu from "../../components/SidebarMenu";

function SalaryManagement() {
  const [list, setList] = useState([]);

  const load = async () => {
    try {
      const res = await api.get("/salary/me");
      setList(res.data);
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi tải dữ liệu lương");
    }
  };

  useEffect(() => {
    const authUser = localStorage.getItem("authUser");
    if (authUser) load();
  }, []);

  return (
    <div className="container mt-3">
      <div className="row">
        <div className="col-3"><SidebarMenu role="employee" /></div>
        <div className="col-9">
          <h3>💰 Lương của tôi</h3>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Ngày công</th>
                <th>Phạt (VND)</th>
                <th>Tăng ca (giờ)</th>
                <th>Tiền ngày (VND)</th>
                <th>Tiền tăng ca (VND/giờ)</th>
                <th>Tổng lương (VND)</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s._id}>
                  <td>{s.totalDays || 0}</td>
                  <td>{s.penalty?.toLocaleString("vi-VN")}</td>
                  <td>{s.overtimeHours || 0}</td>
                  <td>{s.dailyRate?.toLocaleString("vi-VN")}</td>
                  <td>{s.overtimeRate?.toLocaleString("vi-VN")}</td>
                  <td>{s.amount?.toLocaleString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SalaryManagement;
