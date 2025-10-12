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

  // Chuẩn hoá myId/myName để so sánh
  const myId = useMemo(
    () => String(me?._id ?? me?.id ?? me?.userId ?? ""),
    [me]
  );
  const myName = useMemo(
    () => (me?.username || "").trim().toLowerCase(),
    [me]
  );
  const myDept = useMemo(() => me?.department || null, [me]);

  const scrollToBottom = () =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 20);

  // Nhặt id từ nhiều kiểu giá trị
  const extractId = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      // Mongoose doc, ObjectId object, v.v.
      return String(val._id ?? val.id ?? val.$oid ?? "");
    }
    return "";
  };

  // Xác định "tin của mình"
  const isMine = (m) => {
    try {
      const idFromSenderObj = extractId(m?.sender);
      const idFromSenderObjId = extractId(m?.sender?._id); // nếu sender là object { _id, username }
      const idFromSocket = extractId(m?.fromUserId);

      // Ưu tiên so sánh theo id
      if (myId && (idFromSenderObj === myId || idFromSenderObjId === myId || idFromSocket === myId)) {
        return true;
      }

      // Fallback theo username
      const fromName = String(
        m?.sender?.username ?? m?.fromUserName ?? m?.fromUsername ?? ""
      ).trim().toLowerCase();
      if (fromName && myName && fromName === myName) return true;

      return false;
    } catch {
      return false;
    }
  };

  // Chuẩn hoá 1 message về format thống nhất
  const normalizeMsg = (raw) => {
    const senderId =
      extractId(raw?.sender) ||
      extractId(raw?.sender?._id) ||
      extractId(raw?.fromUserId);

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

  // Join user-rooms
  useEffect(() => {
    if (myId) {
      socket.emit("join", { userId: myId, department: me?.department });
    }
  }, [myId, me?.department]);

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

  // Nhận realtime
  useEffect(() => {
    const handler = (payload) => {
      if (!currentRoom) return;
      if (String(payload?.roomId) !== String(currentRoom._id)) return;

      // của chính mình => đã append local, bỏ qua
      if (myId && String(payload?.fromUserId) === myId) return;

      setMessages((prev) => [...prev, normalizeMsg(payload)]);
      scrollToBottom();
    };

    socket.on("receive_message", handler);
    return () => socket.off("receive_message", handler);
  }, [currentRoom, myId]);

  const startPrivateWith = async (otherUserId) => {
    try {
      const res = await api.post("/messages/rooms/private", { otherUserId });
      await loadRooms();
      await openRoom(res.data);
    } catch (err) {
      console.error("❌ Lỗi tạo private room:", err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !currentRoom) return;

    const content = text.trim();

    try {
      // Lưu DB
      const saved = await api.post("/messages", { roomId: currentRoom._id, content });

      // Bản ghi để hiển thị ngay (đảm bảo id/username là của mình)
      const myMsg = normalizeMsg(saved.data);
      myMsg.sender = { _id: myId || myMsg.sender._id, username: me?.username || myMsg.sender.username };

      // Emit cho room
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

  // UI bubble
  const renderBubble = (m) => {
    const mine = isMine(m);
    return (
      <div
        key={m._id || `${m.createdAt}-${Math.random()}`}
        className={`d-flex mb-2 ${mine ? "justify-content-end" : "justify-content-start"}`}
      >
        <div style={{ maxWidth: "72%" }}>
          {!mine && (
            <div className="mb-1">
              <small className="text-muted">
                {m.sender?.username} · {new Date(m.createdAt).toLocaleString()}
              </small>
            </div>
          )}

          <div
            className={`p-2 rounded-3 ${mine ? "bg-primary text-white" : "bg-light"}`}
            style={{ display: "inline-block" }}
          >
            {m.content}
          </div>

          {mine && (
            <div className="mt-1 text-end">
              <small className="text-muted">{new Date(m.createdAt).toLocaleString()}</small>
            </div>
          )}
        </div>
      </div>
    );
  };

  const privateTitle = (room) => {
    const others = (room?.participants || []).filter((p) => extractId(p) !== myId);
    return others.map((p) => p.username).join(", ");
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

              {/* phòng nhóm */}
              {deptRoom && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <strong>👥 {deptRoom.name}</strong>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => openRoom(deptRoom)}>Mở</button>
                  </div>
                </div>
              )}

              {/* danh sách nhân viên */}
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

              {/* private rooms */}
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
              {messages.map((m, i) => {
                const key = m._id || (m.createdAt ? `${m.createdAt}-${i}` : `msg-${i}`);
                return <React.Fragment key={key}>{renderBubble(m)}</React.Fragment>;
              })}
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
