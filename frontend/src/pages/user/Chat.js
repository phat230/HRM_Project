import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import api from "../../api";
import UserLayout from "../../layouts/UserLayout";
import { useAuth } from "../../context/AuthContext";

// Socket base
const SOCKET_BASE =
  (process.env.REACT_APP_API_BASE || "http://localhost:5000").replace("/api", "");

const socket = io(SOCKET_BASE, { transports: ["websocket"], autoConnect: true });

export default function Chat() {
  const { user } = useAuth();
  const me = user; // user hiện tại

  const [deptRoom, setDeptRoom] = useState(null);
  const [privateRooms, setPrivateRooms] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [chatOutsideDept, setChatOutsideDept] = useState(false);

  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);
  const joinedRoomIdRef = useRef(null);

  const myId = me?.id || me?._id || "";
  const myDept = me?.department || null;

  const extractId = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return String(val._id ?? val.id ?? val.$oid ?? "");
  };

  const isMine = (m) => {
    try {
      const senderId = extractId(m.sender);
      return String(senderId) === String(myId);
    } catch {
      return false;
    }
  };

  const normalizeMsg = (raw) => ({
    _id: String(raw?._id || Math.random().toString(36).slice(2)),
    roomId: String(raw?.roomId || currentRoom?._id || ""),
    sender: {
      _id: extractId(raw?.sender),
      username: raw?.sender?.username || raw?.fromUserName || "N/A",
    },
    content: String(raw?.content || raw?.message || ""),
    createdAt: raw?.createdAt || new Date().toISOString(),
  });

  // JOIN socket khi đã có myId
  useEffect(() => {
    if (myId) {
      socket.emit("join", { userId: myId, department: myDept || undefined });
    }

    // cleanup khi rời trang
    return () => {
      if (joinedRoomIdRef.current) {
        socket.emit("leave_room", { roomId: joinedRoomIdRef.current });
      }
    };
  }, [myId, myDept]);

  const loadRooms = async () => {
    try {
      const res = await api.get("/messages/rooms");
      setPrivateRooms(res.data.privateRooms || []);
      setDeptRoom(res.data.deptRoom || null);
    } catch (err) {
      console.error("❌ Lỗi load rooms:", err);
    }
  };

  const loadEmployees = async () => {
    try {
      const scope = chatOutsideDept ? "all" : "dept";
      const res = await api.get(`/employees/peers?scope=${scope}`);
      setEmployees(res.data || []);
    } catch (err) {
      console.error("❌ Lỗi load peers:", err);
      setEmployees([]);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [chatOutsideDept]);

  const loadMessages = async (room) => {
    try {
      const res = await api.get(`/messages/${room._id}`);
      const list = (res.data || []).map(normalizeMsg);
      setMessages(list);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } catch (err) {
      console.error("❌ Lỗi load messages:", err);
      setMessages([]);
    }
  };

  const openRoom = async (room) => {
    if (!room?._id) return;

    if (joinedRoomIdRef.current) {
      socket.emit("leave_room", { roomId: joinedRoomIdRef.current });
    }

    socket.emit("join_room", { roomId: room._id });
    joinedRoomIdRef.current = room._id;

    setCurrentRoom(room);
    loadMessages(room);
  };

  useEffect(() => {
    const handler = (payload) => {
      if (!currentRoom) return;
      if (String(payload.roomId) !== String(currentRoom._id)) return;
      if (String(payload.fromUserId) === String(myId)) return;

      setMessages((prev) => [...prev, normalizeMsg(payload)]);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        60
      );
    };

    socket.on("receive_message", handler);
    return () => socket.off("receive_message", handler);
  }, [currentRoom, myId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !currentRoom) return;

    const content = text.trim();
    try {
      const saved = await api.post("/messages", {
        roomId: currentRoom._id,
        content,
      });

      const msg = normalizeMsg(saved.data);
      msg.sender = { _id: myId, username: me?.username };

      socket.emit("send_message", {
        roomId: currentRoom._id,
        content,
        fromUserId: myId,
        fromUserName: me?.username,
        createdAt: new Date().toISOString(),
      });

      setMessages((p) => [...p, msg]);
      setText("");
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error("❌ Lỗi gửi tin nhắn:", err);
    }
  };

  const startPrivateWith = async (otherId) => {
    try {
      const res = await api.post("/messages/rooms/private", {
        otherUserId: otherId,
      });
      await loadRooms();
      openRoom(res.data);
    } catch (err) {
      console.error("❌ Lỗi tạo phòng private:", err);
    }
  };

  const privateTitle = (room) => {
    const others = (room.participants || []).filter(
      (p) => extractId(p) !== myId
    );
    return others.map((p) => p.username).join(", ");
  };

  // Nếu vì lý do gì đó user chưa sẵn sàng (hiếm),
  // tránh render lung tung
  if (!me) {
    return (
      <UserLayout>
        <div className="text-center mt-4">Đang tải thông tin người dùng...</div>
      </UserLayout>
    );
  }

  return (
    <UserLayout role={me.role}>
      <h2 className="mb-3">💬 Chat</h2>

      <div className="d-flex gap-3">
        {/* Left panel */}
        <div style={{ width: 300 }}>
          <div className="card p-2">
            <h5>Phòng chat</h5>

            <div className="form-check form-switch my-2">
              <input
                className="form-check-input"
                type="checkbox"
                checked={chatOutsideDept}
                onChange={() => setChatOutsideDept((x) => !x)}
              />
              <label className="form-check-label">
                Chat ngoài phòng ban
              </label>
            </div>

            {deptRoom && (
              <div className="mb-2">
                <strong>👥 {deptRoom.name}</strong>
                <button
                  className="btn btn-sm btn-outline-primary float-end"
                  onClick={() => openRoom(deptRoom)}
                >
                  Mở
                </button>
              </div>
            )}

            <hr />

            <small className="text-muted">
              Nhân viên {chatOutsideDept ? "toàn công ty" : "trong phòng ban"}
            </small>

            <div
              className="list-group mt-1"
              style={{ maxHeight: 250, overflowY: "auto" }}
            >
              {employees.map((e) => (
                <button
                  key={e._id}
                  className="list-group-item list-group-item-action"
                  onClick={() => startPrivateWith(e.userId)}
                >
                  {e.name} ({e.username})
                </button>
              ))}
            </div>

            <hr />

            <small className="text-muted">Đoạn chat gần đây</small>
            <div
              className="list-group mt-1"
              style={{ maxHeight: 200, overflowY: "auto" }}
            >
              {privateRooms.map((r) => (
                <button
                  key={r._id}
                  className="list-group-item list-group-item-action"
                  onClick={() => openRoom(r)}
                >
                  {r.type === "group" ? r.name : privateTitle(r)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat box */}
        <div className="flex-grow-1">
          <div className="card">
            <div className="card-header d-flex justify-content-between">
              <strong>
                {currentRoom
                  ? currentRoom.type === "group"
                    ? `👥 ${currentRoom.name}`
                    : `💬 ${privateTitle(currentRoom)}`
                  : "Chọn đoạn chat để bắt đầu"}
              </strong>

              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => currentRoom && loadMessages(currentRoom)}
                disabled={!currentRoom}
              >
                ⟳
              </button>
            </div>

            <div
              className="card-body"
              style={{ height: 520, overflowY: "auto" }}
            >
              {messages.map((m) => (
                <div
                  key={m._id}
                  className={`d-flex mb-2 ${
                    isMine(m) ? "justify-content-end" : "justify-content-start"
                  }`}
                >
                  <div
                    className={`p-2 px-3 rounded-4 shadow-sm ${
                      isMine(m)
                        ? "bg-primary text-white"
                        : "bg-light text-dark"
                    }`}
                    style={{
                      maxWidth: "70%",
                      borderRadius: isMine(m)
                        ? "18px 18px 2px 18px"
                        : "18px 18px 18px 2px",
                    }}
                  >
                    {!isMine(m) && (
                      <div className="small text-muted mb-1">
                        {m.sender?.username}
                      </div>
                    )}
                    <div>{m.content}</div>
                    <div
                      className="small text-muted mt-1"
                      style={{ fontSize: "0.75rem" }}
                    >
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}

              <div ref={bottomRef}></div>
            </div>

            <div className="card-footer">
              <form onSubmit={sendMessage} className="d-flex gap-2">
                <input
                  className="form-control"
                  placeholder="Nhập tin nhắn..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={!currentRoom}
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
    </UserLayout>
  );
}