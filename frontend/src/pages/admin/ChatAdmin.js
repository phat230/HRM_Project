// frontend/src/pages/admin/ChatAdmin.js
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import api from "../../api";
import SidebarMenu from "../../components/SidebarMenu";
import { useAuth } from "../../context/AuthContext";

const socket = io(process.env.REACT_APP_API_BASE?.replace("/api", "") || "http://localhost:5000", {
  transports: ["websocket"]
});

export default function ChatAdmin() {
  const { user } = useAuth();
  const me = user?.user;
  const [employees, setEmployees] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef();

  useEffect(() => {
    socket.emit("join", { userId: me?._id });
    loadRooms();
    loadEmployees();
  }, [me]);

  const loadRooms = async () => {
    const res = await api.get("/messages/rooms");
    const combined = [];
    if (res.data.deptRoom) combined.push(res.data.deptRoom);
    if (res.data.privateRooms) combined.push(...res.data.privateRooms);
    setRooms(combined);
  };

  const loadEmployees = async () => {
    const res = await api.get("/admin/employees");
    setEmployees(res.data || []);
  };

  const loadMessages = async (room) => {
    const res = await api.get(`/messages/${room._id}`);
    setMessages(res.data || []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const openRoom = async (room) => {
    setCurrentRoom(room);
    await loadMessages(room);
  };

  const startPrivateWith = async (userId) => {
    const res = await api.post("/messages/rooms/private", { otherUserId: userId });
    await loadRooms();
    setCurrentRoom(res.data);
    await loadMessages(res.data);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !currentRoom) return;

    const saved = await api.post("/messages", { roomId: currentRoom._id, content: text.trim() });

    // Gửi realtime qua socket
    socket.emit("send_message", {
      type: currentRoom.type === "group" ? "group" : "private",
      department: currentRoom.department,
      roomId: currentRoom._id,
      fromUserId: me?._id,
      fromUsername: me?.username,
      message: saved.data.content
    });

    setMessages((prev) => [...prev, saved.data]);
    setText("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  useEffect(() => {
    const handler = (payload) => {
      if (!currentRoom || payload.roomId !== currentRoom._id) return;
      setMessages((prev) => [
        ...prev,
        {
          _id: Math.random().toString(36).slice(2),
          sender: { username: payload.fromUsername },
          content: payload.message,
          createdAt: new Date().toISOString()
        }
      ]);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    socket.on("receive_message", handler);
    return () => socket.off("receive_message", handler);
  }, [currentRoom]);

  return (
    <div className="container-fluid mt-3">
      <div className="row">
        <div className="col-3">
          <SidebarMenu role="admin" />
          <div className="card mt-3">
            <div className="card-header"><strong>💬 Chat (Admin)</strong></div>
            <div className="card-body p-2">
              <small className="text-muted">Danh sách nhân viên</small>
              <div className="list-group mt-1" style={{ maxHeight: 300, overflowY: "auto" }}>
                {employees.map(e => (
                  <button key={e._id}
                    className="list-group-item list-group-item-action"
                    onClick={() => startPrivateWith(e.userId?._id)}>
                    {e.name} <span className="text-muted">({e.userId?.username})</span>
                  </button>
                ))}
              </div>

              <hr className="my-2" />
              <small className="text-muted">Các phòng chat</small>
              <div className="list-group mt-1" style={{ maxHeight: 300, overflowY: "auto" }}>
                {rooms.map(r => (
                  <button key={r._id}
                    className="list-group-item list-group-item-action"
                    onClick={() => openRoom(r)}>
                    {r.name || r.participants?.map(p => p.username).join(", ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-9">
          <div className="card">
            <div className="card-header">
              {currentRoom
                ? currentRoom.name || `💬 ${(currentRoom.participants || []).map(p => p.username).join(", ")}`
                : "Chọn đoạn chat để bắt đầu"}
            </div>
            <div className="card-body" style={{ height: 520, overflowY: "auto" }}>
              {messages.map(m => (
                <div key={m._id} className={`mb-2 ${m.sender?._id === me?._id ? "text-end" : ""}`}>
                  <div><small className="text-muted">{m.sender?.username} · {new Date(m.createdAt).toLocaleString()}</small></div>
                  <div className={`d-inline-block p-2 rounded ${m.sender?._id === me?._id ? "bg-primary text-white" : "bg-light"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="card-footer">
              <form onSubmit={sendMessage} className="d-flex gap-2">
                <input className="form-control" placeholder="Nhập tin nhắn..." value={text}
                  onChange={(e) => setText(e.target.value)} />
                <button className="btn btn-primary" disabled={!currentRoom || !text.trim()}>Gửi</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
