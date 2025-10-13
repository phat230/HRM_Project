import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/api/api_client.dart';
import 'chat_service.dart';

class ChatAdminRoomScreen extends StatefulWidget {
  const ChatAdminRoomScreen({
    super.key,
    required this.roomId,
    required this.isGroup,
    this.title,
  });

  final String roomId;
  final bool isGroup;
  final String? title;

  @override
  State<ChatAdminRoomScreen> createState() => _ChatAdminRoomScreenState();
}

class _ChatAdminRoomScreenState extends State<ChatAdminRoomScreen> {
  final _msgCtrl = TextEditingController();
  final _listCtrl = ScrollController();
  final List<Map<String, dynamic>> _messages = [];

  String? _meId;
  String? _meName;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    // ✅ Lấy thông tin người dùng hiện tại
    final sp = await SharedPreferences.getInstance();
    _meId = sp.getString('user_id');
    _meName = sp.getString('username') ?? 'me';

    // Nếu thiếu _meId thì gọi API để đồng bộ lại
    if (_meId == null || _meId!.isEmpty) {
      try {
        final me = await ApiClient.instance.dio.get('/employees/me');
        final id = (me.data?['userId']?['_id'])?.toString();
        if (id != null && id.isNotEmpty) _meId = id;
      } catch (_) {}
    }

    // ✅ Load lịch sử
    await _loadHistory();

    // ✅ Join room socket
    final s = ChatService.instance.socket();
    s.emit('join_room', {'roomId': widget.roomId});
    ChatService.instance.onMessage((data) {
      if (data is! Map) return;
      if (data['roomId']?.toString() != widget.roomId) return;
      final normalized = _normalizeMsg(data);
      setState(() => _messages.add(normalized));
      _scrollToBottom();
    });
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
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      }
    }
  }

  Future<void> _send() async {
    final txt = _msgCtrl.text.trim();
    if (txt.isEmpty) return;

    try {
      final res = await ApiClient.instance.dio.post('/messages', data: {
        'roomId': widget.roomId,
        'content': txt,
      });
      final saved = _normalizeMsg(Map<String, dynamic>.from(res.data as Map));
      saved['sender'] = {'_id': _meId, 'username': _meName};

      ChatService.instance.sendMessage({
        'roomId': widget.roomId,
        'content': txt,
        'fromUserId': _meId,
        'fromUserName': _meName,
        'createdAt': DateTime.now().toIso8601String(),
      });

      setState(() => _messages.add(saved));
      _msgCtrl.clear();
      _scrollToBottom();
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?.toString() ?? 'Gửi tin thất bại';
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      }
    }
  }

  // ----------------- Helpers -----------------

  Map<String, dynamic> _normalizeMsg(Map m) {
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
    final id = _senderIdOf(m);
    if (_meId != null && _meId!.isNotEmpty && id != null) return id == _meId;
    final name = _senderNameOf(m);
    if (_meName != null && _meName!.isNotEmpty && name != null) return name == _meName;
    return false;
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
                final time = DateTime.tryParse(m['createdAt'] ?? '');

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
                            ? Theme.of(context).colorScheme.primary
                            : Theme.of(context).colorScheme.surfaceVariant,
                        borderRadius: BorderRadius.only(
                          topLeft: const Radius.circular(14),
                          topRight: const Radius.circular(14),
                          bottomLeft: Radius.circular(mine ? 14 : 0),
                          bottomRight: Radius.circular(mine ? 0 : 14),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment:
                            mine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                        children: [
                          if (!mine && user.isNotEmpty)
                            Text(user,
                                style: Theme.of(context)
                                    .textTheme
                                    .labelSmall
                                    ?.copyWith(color: Colors.black54)),
                          Text(
                            text,
                            style: TextStyle(
                                color: mine ? Colors.white : Colors.black87),
                          ),
                          if (time != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Text(
                                '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}',
                                style: Theme.of(context)
                                    .textTheme
                                    .labelSmall
                                    ?.copyWith(
                                        color: mine
                                            ? Colors.white70
                                            : Colors.black45,
                                        fontSize: 11),
                              ),
                            ),
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
