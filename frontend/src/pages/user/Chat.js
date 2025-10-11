// frontend/src/pages/user/Chat.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import io from "socket.io-client";
import api from "../../api";
import SidebarMenu from "../../components/SidebarMenu";
import { useAuth } from "../../context/AuthContext";

const socket = io(process.env.REACT_APP_API_BASE?.replace("/api", "") || "http://localhost:5000", {
  transports: ["websocket"],
});

export default function Chat() {
  const { user } = useAuth(); // { user: {_id, username, role, ...} }
  const me = user?.user;

  const [deptRoom, setDeptRoom] = useState(null);
  const [privateRooms, setPrivateRooms] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [chatOutsideDept, setChatOutsideDept] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const bottomRef = useRef();
  const myDepartment = useMemo(() => me?.department || null, [me]);

  // 🧩 Khi user đăng nhập → join phòng socket riêng và phòng ban
  useEffect(() => {
    if (me?._id) {
      socket.emit("join", { userId: me._id, department: me.department });
    }
  }, [me]);

  // 🗂 Lấy danh sách phòng ban + private rooms
  const loadRooms = async () => {
    try {
      const res = await api.get("/messages/rooms");
      setPrivateRooms(res.data.privateRooms || []);
      setDeptRoom(res.data.deptRoom || null);
    } catch (err) {
      console.error("❌ Lỗi load rooms:", err);
    }
  };

  // 👥 Lấy danh sách nhân viên (cùng phòng hoặc toàn công ty)
  const loadEmployees = async () => {
    try {
      const scope = chatOutsideDept ? "all" : "dept";
      const res = await api.get(`/employees/peers?scope=${scope}`);
      setEmployees(res.data || []);
    } catch (err) {
      console.error("❌ Lỗi load danh sách nhân viên:", err);
      setEmployees([]);
    }
  };

  // 💬 Lấy tin nhắn trong phòng
  const loadMessages = async (room) => {
    try {
      const res = await api.get(`/messages/${room._id}`);
      setMessages(res.data || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      console.error("❌ Lỗi load tin nhắn:", err);
      setMessages([]);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [chatOutsideDept]);

  // 🔄 Socket realtime: nhận tin nhắn
  useEffect(() => {
    const handler = (payload) => {
      if (!currentRoom) return;
      if (payload.roomId && payload.roomId !== currentRoom._id) return;

      setMessages((prev) => [
        ...prev,
        {
          _id: Math.random().toString(36).slice(2),
          sender: { username: payload.fromUsername || "N/A" },
          content: payload.message,
          createdAt: new Date().toISOString(),
        },
      ]);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    socket.on("receive_message", handler);
    return () => socket.off("receive_message", handler);
  }, [currentRoom]);

  const openRoom = async (room) => {
    setCurrentRoom(room);
    await loadMessages(room);
  };

  const startPrivateWith = async (otherUserId) => {
    try {
      const res = await api.post("/messages/rooms/private", { otherUserId });
      await loadRooms();
      setCurrentRoom(res.data);
      await loadMessages(res.data);
    } catch (err) {
      console.error("❌ Lỗi tạo private room:", err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !currentRoom) return;

    try {
      // Lưu DB
      const saved = await api.post("/messages", { roomId: currentRoom._id, content: text.trim() });

      // Emit realtime
      if (currentRoom.type === "group") {
        socket.emit("send_message", {
          type: "group",
          department: currentRoom.department,
          roomId: currentRoom._id,
          fromUserId: me?._id,
          fromUsername: me?.username,
          message: saved.data.content,
        });
      } else {
        const others = (currentRoom.participants || [])
          .map((p) => p._id)
          .filter((id) => id !== me?._id);
        const toUserId = others?.[0];

        socket.emit("send_message", {
          type: "private",
          toUserId,
          roomId: currentRoom._id,
          fromUserId: me?._id,
          fromUsername: me?.username,
          message: saved.data.content,
        });
      }

      setMessages((prev) => [...prev, saved.data]);
      setText("");
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error("❌ Lỗi gửi tin nhắn:", err);
    }
  };

  return (
    <div className="container-fluid mt-3">
      <div className="row">
        {/* Sidebar */}
        <div className="col-3">
          <SidebarMenu role="user" />
          <div className="card mt-3">
            <div className="card-header"><strong>Chat</strong></div>
            <div className="card-body p-2">
              <div className="form-check form-switch mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={chatOutsideDept}
                  onChange={() => setChatOutsideDept((v) => !v)}
                  id="switchOutside"
                />
                <label htmlFor="switchOutside">Chat ngoài phòng ban</label>
              </div>

              {/* Phòng ban */}
              {deptRoom && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <strong>👥 {deptRoom.name}</strong>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => openRoom(deptRoom)}
                    >
                      Mở
                    </button>
                  </div>
                </div>
              )}

              {/* Danh sách nhân viên */}
              <hr />
              <small className="text-muted">
                Nhân viên {chatOutsideDept ? "toàn công ty" : "trong phòng ban"}
              </small>
              <div className="list-group mt-1" style={{ maxHeight: 320, overflowY: "auto" }}>
                {employees.length === 0 ? (
                  <div className="text-muted small px-2">Không có nhân viên nào</div>
                ) : (
                  employees
                    .filter((e) => e.userId !== me?._id)
                    .filter((e) => chatOutsideDept ? true : e.department === myDepartment)
                    .map((e) => (
                      <button
                        key={e._id}
                        className="list-group-item list-group-item-action"
                        onClick={() => startPrivateWith(e.userId)}
                      >
                        {e.name || "Chưa đặt tên"}{" "}
                        <span className="text-muted">({e.username})</span>
                      </button>
                    ))
                )}
              </div>

              {/* Private rooms */}
              <hr className="my-2" />
              <small className="text-muted">Đoạn chat gần đây</small>
              <div className="list-group mt-1" style={{ maxHeight: 200, overflowY: "auto" }}>
                {privateRooms.map((r) => (
                  <button
                    key={r._id}
                    className="list-group-item list-group-item-action"
                    onClick={() => openRoom(r)}
                  >
                    {r.participants?.map((p) => p.username).join(" , ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Khung chat */}
        <div className="col-9">
          <div className="card">
            <div className="card-header">
              {currentRoom
                ? currentRoom.type === "group"
                  ? `👥 ${currentRoom.name}`
                  : `💬 ${(currentRoom.participants || [])
                      .map((p) => p.username)
                      .join(" , ")}`
                : "Chọn 1 đoạn hội thoại"}
            </div>
            <div className="card-body" style={{ height: 520, overflowY: "auto" }}>
              {messages.map((m) => (
                <div
                  key={m._id}
                  className={`mb-2 ${m.sender?._id === me?._id ? "text-end" : ""}`}
                >
                  <div>
                    <small className="text-muted">
                      {m.sender?.username} · {new Date(m.createdAt).toLocaleString()}
                    </small>
                  </div>
                  <div
                    className={`d-inline-block p-2 rounded ${
                      m.sender?._id === me?._id ? "bg-primary text-white" : "bg-light"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="card-footer">
              <form onSubmit={sendMessage} className="d-flex gap-2">
                <input
                  className="form-control"
                  placeholder="Nhập tin nhắn..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button
                  className="btn btn-primary"
                  disabled={!currentRoom || !text.trim()}
                >
                  Gửi
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
