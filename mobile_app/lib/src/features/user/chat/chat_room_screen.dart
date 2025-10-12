import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

import '../../../core/api/api_client.dart';
import '../../../core/config/env.dart';

class ChatRoomScreen extends StatefulWidget {
  const ChatRoomScreen({
    super.key,
    required this.roomId,
    required this.isGroup,
    this.title,
  });

  final String roomId;
  final bool isGroup;
  final String? title;

  @override
  State<ChatRoomScreen> createState() => _ChatRoomScreenState();
}

class _ChatRoomScreenState extends State<ChatRoomScreen> {
  final _msgCtrl = TextEditingController();
  final _listCtrl = ScrollController();
  final List<Map<String, dynamic>> _messages = [];

  IO.Socket? _socket;
  String? _meId;
  String? _meName;

  String get _socketBase {
    final u = Env.apiBase;
    final i = u.indexOf('/api');
    return i > 0 ? u.substring(0, i) : u;
  }

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    // 1) lấy info của mình
    final sp = await SharedPreferences.getInstance();
    _meId = sp.getString('user_id');
    _meName = sp.getString('username') ?? 'me';

    // nếu chưa có user_id -> gọi API để lấy
    if (_meId == null || _meId!.isEmpty) {
      try {
        final me = await ApiClient.instance.dio.get('/employees/me');
        final id = (me.data?['userId']?['_id'])?.toString();
        if (id != null && id.isNotEmpty) _meId = id;
      } catch (_) {}
    }

    // 2) load lịch sử
    await _loadHistory();

    // 3) connect socket + join room
    final s = IO.io(
      _socketBase,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .enableReconnection()
          .setReconnectionDelay(1000)
          .build(),
    );
    s.onConnect((_) => s.emit('join_room', {'roomId': widget.roomId}));

    // 4) nhận tin realtime
    s.on('receive_message', (data) {
      if (data is! Map) return;
      if (data['roomId']?.toString() != widget.roomId) return;

      final normalized = _normalizeMsg(data);
      setState(() => _messages.add(normalized));
      _scrollToBottom();
    });

    setState(() => _socket = s);
  }

  Future<void> _loadHistory() async {
    try {
      final res = await ApiClient.instance.dio.get('/messages/${widget.roomId}');
      final list = (res.data as List).cast<Map<String, dynamic>>();
      setState(() {
        _messages
          ..clear()
          ..addAll(list.map(_normalizeMsg));
      });
      _scrollToBottom();
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?.toString() ?? 'Lỗi tải tin nhắn';
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    }
  }

  Future<void> _send() async {
    final txt = _msgCtrl.text.trim();
    if (txt.isEmpty) return;

    try {
      // 1) Lưu DB
      final res = await ApiClient.instance.dio.post('/messages', data: {
        'roomId': widget.roomId,
        'content': txt,
      });
      final saved = _normalizeMsg(Map<String, dynamic>.from(res.data as Map));

      // đảm bảo tin của mình có sender là mình
      saved['sender'] = {'_id': _meId, 'username': _meName};

      // 2) phát socket
      _socket?.emit('send_message', {
        'roomId': widget.roomId,
        'content': txt,
        'fromUserId': _meId,
        'fromUserName': _meName,
        'createdAt': DateTime.now().toIso8601String(),
      });

      // 3) hiển thị ngay
      setState(() => _messages.add(saved));
      _msgCtrl.clear();
      _scrollToBottom();
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?.toString() ?? 'Gửi tin thất bại';
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    }
  }

  // ----------------- Helpers -----------------

  Map<String, dynamic> _normalizeMsg(Map m) {
    // hợp nhất các format khác nhau về cùng dạng
    final sender = m['sender'];
    final fromId = m['fromUserId'] ?? (sender is Map ? sender['_id'] : null);
    final fromName = m['fromUserName'] ?? (sender is Map ? sender['username'] : null);

    return {
      '_id': (m['_id'] ?? DateTime.now().millisecondsSinceEpoch).toString(),
      'roomId': (m['roomId'] ?? widget.roomId).toString(),
      'sender': {
        '_id': fromId?.toString(),
        'username': fromName?.toString(),
      },
      'content': (m['content'] ?? '').toString(),
      'createdAt': (m['createdAt'] ?? DateTime.now().toIso8601String()).toString(),
    };
  }

  String? _senderIdOf(Map m) {
    final s = m['sender'];
    if (s is Map && s['_id'] != null && s['_id'].toString().isNotEmpty) {
      return s['_id'].toString();
    }
    return null;
  }

  String? _senderNameOf(Map m) {
    final s = m['sender'];
    if (s is Map && s['username'] != null && s['username'].toString().isNotEmpty) {
      return s['username'].toString();
    }
    return null;
  }

  bool _isMine(Map m) {
    // Ưu tiên so sánh theo id; nếu thiếu id, fallback so sánh theo username
    final id = _senderIdOf(m);
    if (_meId != null && _meId!.isNotEmpty && id != null) return id == _meId;
    final name = _senderNameOf(m);
    if (_meName != null && _meName!.isNotEmpty && name != null) return name == _meName;
    return false;
    // với logic này, tin mình sẽ sang phải; người khác sang trái
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_listCtrl.hasClients) {
        _listCtrl.animateTo(
          _listCtrl.position.maxScrollExtent + 80,
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _socket?.emit('leave_room', {'roomId': widget.roomId});
    _socket?.dispose();
    _msgCtrl.dispose();
    _listCtrl.dispose();
    super.dispose();
  }

  // ----------------- UI -----------------

  @override
  Widget build(BuildContext context) {
    final title = widget.title ?? (widget.isGroup ? 'Nhóm' : 'Chat 1-1');

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          IconButton(onPressed: _loadHistory, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _listCtrl,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              itemCount: _messages.length,
              itemBuilder: (_, i) {
                final m = _messages[i];
                final mine = _isMine(m);
                final user = _senderNameOf(m) ?? '';
                final text = (m['content'] ?? '').toString();

                return Align(
                  alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.72,
                    ),
                    child: Container(
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: mine
                            ? Theme.of(context).colorScheme.primaryContainer
                            : Theme.of(context).colorScheme.surfaceVariant,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Column(
                        crossAxisAlignment:
                            mine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                        children: [
                          if (!mine && user.isNotEmpty)
                            Text(user, style: Theme.of(context).textTheme.labelSmall),
                          Text(text),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const Divider(height: 1),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _msgCtrl,
                      decoration: const InputDecoration(hintText: 'Nhập tin nhắn...'),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  IconButton(onPressed: _send, icon: const Icon(Icons.send)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
