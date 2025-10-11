import React, { useEffect, useState } from "react";
import SidebarMenu from "../../components/SidebarMenu";
import api from "../../api";

function LeaveHistory() {
  const [list, setList] = useState([]);

  useEffect(() => {
    api.get("/leave-requests/me").then(res => setList(res.data));
  }, []);

  return (
    <div className="container mt-3">
      <div className="row">
        <div className="col-3"><SidebarMenu role="user" /></div>
        <div className="col-9">
          <h3>📜 Lịch sử nghỉ phép</h3>
          <table className="table table-bordered">
            <thead><tr><th>Từ</th><th>Đến</th><th>Lý do</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {list.map(l => (
                <tr key={l._id}>
                  <td>{new Date(l.from).toLocaleDateString()}</td>
                  <td>{new Date(l.to).toLocaleDateString()}</td>
                  <td>{l.reason}</td>
                  <td>{l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default LeaveHistory;
