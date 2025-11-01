// frontend/src/pages/user/Chat.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import io from "socket.io-client";
import api from "../../api";
import SidebarMenu from "../../components/SidebarMenu";
import { useAuth } from "../../context/AuthContext";

const SOCKET_BASE =
  (process.env.REACT_APP_API_BASE || "http://localhost:5000").replace("/api", "");
const socket = io(SOCKET_BASE, { transports: ["websocket"], autoConnect: true });

export default function Chat() {
  const { user } = useAuth();
  const me = user?.user;

  const [deptRoom, setDeptRoom] = useState(null);
  const [privateRooms, setPrivateRooms] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [chatOutsideDept, setChatOutsideDept] = useState(false);

  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const bottomRef = useRef(null);
  const joinedRoomIdRef = useRef(null);

  // ===== Helpers =====
  const myId = useMemo(() => String(me?._id ?? me?.id ?? me?.userId ?? ""), [me]);
  const myName = useMemo(() => (me?.username || "").trim().toLowerCase(), [me]);
  const myDept = useMemo(() => me?.department || null, [me]);

  const scrollToBottom = () =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

  const extractId = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") return String(val._id ?? val.id ?? val.$oid ?? "");
    return "";
  };

  // ✅ Chuẩn: chỉ so sánh string ID, tránh sai kiểu ObjectId
  const isMine = (m) => {
    try {
      const senderId =
        extractId(m?.sender) || extractId(m?.sender?._id) || extractId(m?.fromUserId);
      return String(senderId) === String(myId);
    } catch {
      return false;
    }
  };

  const normalizeMsg = (raw) => {
    const senderId =
      extractId(raw?.sender) || extractId(raw?.sender?._id) || extractId(raw?.fromUserId);

    const senderName =
      raw?.sender?.username ?? raw?.fromUserName ?? raw?.fromUsername ?? "";

    return {
      _id: String(raw?._id || Math.random().toString(36).slice(2)),
      roomId: String(raw?.roomId || currentRoom?._id || ""),
      sender: { _id: senderId || null, username: senderName || "N/A" },
      content: String(raw?.content ?? raw?.message ?? ""),
      createdAt: raw?.createdAt || new Date().toISOString(),
    };
  };

  // ===== Socket join user & dept =====
  useEffect(() => {
    if (myId) socket.emit("join", { userId: myId, department: me?.department });
  }, [myId, me?.department]);

  // ===== Load rooms / employees =====
  const loadRooms = async () => {
    try {
      const res = await api.get("/messages/rooms");
      setPrivateRooms(res.data?.privateRooms || []);
      setDeptRoom(res.data?.deptRoom || null);
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
      console.error("❌ Lỗi load nhân viên:", err);
      setEmployees([]);
    }
  };

  useEffect(() => { loadRooms(); }, []);
  useEffect(() => { loadEmployees(); }, [chatOutsideDept]);

  // ===== Open/join room & load messages =====
  const openRoom = async (room) => {
    if (!room?._id) return;
    if (joinedRoomIdRef.current) {
      socket.emit("leave_room", { roomId: joinedRoomIdRef.current });
    }
    socket.emit("join_room", { roomId: room._id });
    joinedRoomIdRef.current = room._id;

    setCurrentRoom(room);
    await loadMessages(room);
  };

  const loadMessages = async (room) => {
    try {
      const res = await api.get(`/messages/${room._id}`);
      const list = (res.data || []).map(normalizeMsg);
      setMessages(list);
      scrollToBottom();
    } catch (err) {
      console.error("❌ Lỗi load tin nhắn:", err);
      setMessages([]);
    }
  };

  // ===== Receive realtime =====
  useEffect(() => {
    const handler = (payload) => {
      if (!currentRoom) return;
      if (String(payload?.roomId) !== String(currentRoom._id)) return;
      if (String(payload?.fromUserId) === String(myId)) return; // bỏ echo của chính mình
      setMessages((prev) => [...prev, normalizeMsg(payload)]);
      scrollToBottom();
    };
    socket.on("receive_message", handler);
    return () => socket.off("receive_message", handler);
  }, [currentRoom, myId]);

  // ===== Start private with another user =====
  const startPrivateWith = async (otherUserId) => {
    try {
      const res = await api.post("/messages/rooms/private", { otherUserId });
      await loadRooms();
      await openRoom(res.data);
    } catch (err) {
      console.error("❌ Lỗi tạo private room:", err);
    }
  };

  // ===== Send message =====
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !currentRoom) return;

    const content = text.trim();
    try {
      const saved = await api.post("/messages", { roomId: currentRoom._id, content });

      // Hiển thị ngay bản ghi của mình
      const myMsg = normalizeMsg(saved.data);
      myMsg.sender = { _id: myId, username: me?.username || "Tôi" };

      // Emit realtime cho room
      socket.emit("send_message", {
        roomId: currentRoom._id,
        content,
        fromUserId: myId,
        fromUserName: me?.username,
        createdAt: new Date().toISOString(),
      });

      setMessages((prev) => [...prev, myMsg]);
      setText("");
      scrollToBottom();
    } catch (err) {
      console.error("❌ Lỗi gửi tin:", err);
    }
  };

  // ===== UI: Bubble kiểu Messenger =====
  const renderBubble = (m) => {
    const mine = isMine(m);
    return (
      <div
        key={m._id}
        className={`d-flex mb-2 ${mine ? "justify-content-end" : "justify-content-start"}`}
      >
        <div
          className={`p-2 px-3 rounded-4 shadow-sm ${
            mine ? "bg-primary text-white align-self-end" : "bg-light text-dark align-self-start"
          }`}
          style={{
            maxWidth: "70%",
            borderRadius: mine ? "18px 18px 2px 18px" : "18px 18px 18px 2px",
          }}
        >
          {!mine && (
            <div className="small text-muted mb-1">{m.sender?.username}</div>
          )}
          <div>{m.content}</div>
          <div
            className={`small text-muted mt-1 ${mine ? "text-end" : ""}`}
            style={{ fontSize: "0.75rem" }}
          >
            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>
    );
  };

  const privateTitle = (room) => {
    const others = (room?.participants || []).filter((p) => extractId(p) !== myId);
    return others.map((p) => p.username).join(", ");
  };

  // ===== UI Layout =====
  return (
    <div className="container-fluid mt-3">
      <div className="row">
        {/* Sidebar */}
        <div className="col-3">
          <SidebarMenu role="user" />
          <div className="card mt-3">
            <div className="card-header"><strong>💬 Chat</strong></div>
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

              {/* Phòng nhóm */}
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
                    .filter((e) => String(e.userId) !== myId)
                    .filter((e) => (chatOutsideDept ? true : e.department === myDept))
                    .map((e, i) => (
                      <button
                        key={e.userId || e._id || `emp-${i}`}
                        className="list-group-item list-group-item-action"
                        onClick={() => startPrivateWith(e.userId)}
                      >
                        {e.name || "Chưa đặt tên"}{" "}
                        <span className="text-muted">({e.username})</span>
                      </button>
                    ))
                )}
              </div>

              {/* Phòng private gần đây */}
              <hr className="my-2" />
              <small className="text-muted">Đoạn chat gần đây</small>
              <div className="list-group mt-1" style={{ maxHeight: 200, overflowY: "auto" }}>
                {privateRooms.map((r, i) => (
                  <button
                    key={r._id || `room-${i}`}
                    className="list-group-item list-group-item-action"
                    onClick={() => openRoom(r)}
                  >
                    {r.type === "group" ? r.name : privateTitle(r)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Khung chat */}
        <div className="col-9">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <div>
                {currentRoom
                  ? currentRoom.type === "group"
                    ? `👥 ${currentRoom.name}`
                    : `💬 ${privateTitle(currentRoom)}`
                  : "Chọn 1 đoạn hội thoại"}
              </div>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => currentRoom && loadMessages(currentRoom)}
                disabled={!currentRoom}
                title="Làm mới"
              >
                ⟳
              </button>
            </div>

            <div className="card-body" style={{ height: 520, overflowY: "auto" }}>
              {messages.map((m) => renderBubble(m))}
              <div ref={bottomRef} />
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
                <button className="btn btn-primary" disabled={!currentRoom || !text.trim()}>
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
