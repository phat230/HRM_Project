// lib/src/features/user/chat/chat_list_screen.dart
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import 'chat_room_screen.dart';

class ChatListScreen extends StatefulWidget {
  const ChatListScreen({super.key});
  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  bool loading = true;
  String? error;

  List<dynamic> deptPeers = [];   // cùng phòng ban (1-1)
  List<dynamic> allPeers = [];    // ngoài phòng ban (1-1)
  Map<String, dynamic>? deptRoom; // phòng nhóm của phòng ban

  Future<void> _load() async {
    setState(() { loading = true; error = null; });
    try {
      final resDept = await ApiClient.instance.dio.get('/employees/peers', queryParameters: {'scope': 'dept'});
      final resAll  = await ApiClient.instance.dio.get('/employees/peers', queryParameters: {'scope': 'all'});
      final resRooms = await ApiClient.instance.dio.get('/messages/rooms');

      deptPeers = (resDept.data as List? ?? []);
      allPeers  = (resAll.data  as List? ?? []).where((m) {
        final uid = (m as Map)['userId']?.toString();
        return !(deptPeers as List).any((x) => (x as Map)['userId']?.toString() == uid);
      }).toList();

      final rooms = (resRooms.data as Map<String, dynamic>);
      deptRoom = rooms['deptRoom'] as Map<String, dynamic>?;
    } on DioException catch (e) {
      error = e.response?.data?['error']?.toString() ?? 'Lỗi tải danh sách chat';
    } finally {
      if (mounted) setState(() { loading = false; });
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Chat'),
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.group), text: 'Cùng phòng'),
              Tab(icon: Icon(Icons.travel_explore), text: 'Ngoài phòng'),
              Tab(icon: Icon(Icons.forum), text: 'Nhóm'),
            ],
          ),
          actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh))],
        ),
        body: loading
            ? const Center(child: CircularProgressIndicator())
            : (error != null)
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(error!, style: const TextStyle(color: Colors.red)),
                    ),
                  )
                : TabBarView(
                    children: [
                      // --- TAB 1: Cùng phòng ban (1-1) ---
                      _PeerList(
                        peers: deptPeers,
                        onOpen: (m) async {
                          final res = await ApiClient.instance.dio.post('/messages/rooms/private', data: {
                            'otherUserId': m['userId'],
                          });
                          final room = res.data as Map<String, dynamic>;
                          if (!mounted) return;
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => ChatRoomScreen(
                                roomId: room['_id'].toString(),
                                title: m['name']?.toString() ?? m['username']?.toString(),
                                isGroup: false,
                              ),
                            ),
                          );
                        },
                      ),

                      // --- TAB 2: Ngoài phòng ban (1-1) ---
                      _PeerList(
                        peers: allPeers,
                        onOpen: (m) async {
                          final res = await ApiClient.instance.dio.post('/messages/rooms/private', data: {
                            'otherUserId': m['userId'],
                          });
                          final room = res.data as Map<String, dynamic>;
                          if (!mounted) return;
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => ChatRoomScreen(
                                roomId: room['_id'].toString(),
                                title: m['name']?.toString() ?? m['username']?.toString(),
                                isGroup: false,
                              ),
                            ),
                          );
                        },
                      ),

                      // --- TAB 3: Nhóm phòng ban ---
                      _DeptGroup(
                        deptRoom: deptRoom,
                        onOpen: () {
                          if (deptRoom == null) return;
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => ChatRoomScreen(
                                roomId: deptRoom!['_id'].toString(),
                                title: (deptRoom!['name'] ?? 'Phòng ban').toString(),
                                isGroup: true,
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
      ),
    );
  }
}

class _PeerList extends StatelessWidget {
  const _PeerList({required this.peers, required this.onOpen});
  final List peers;
  final void Function(Map<String, dynamic> peer) onOpen;

  @override
  Widget build(BuildContext context) {
    if (peers.isEmpty) {
      return const Center(child: Text('Không có nhân viên phù hợp'));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(12),
      itemCount: peers.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) {
        final m = peers[i] as Map<String, dynamic>;
        final title = m['name']?.toString() ?? m['username']?.toString() ?? '(không tên)';
        final sub   = m['department']?.toString() ?? '';
        return Card(
          child: ListTile(
            leading: const CircleAvatar(child: Icon(Icons.person)),
            title: Text(title),
            subtitle: Text(sub),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => onOpen(m),
          ),
        );
      },
    );
  }
}

class _DeptGroup extends StatelessWidget {
  const _DeptGroup({required this.deptRoom, required this.onOpen});
  final Map<String, dynamic>? deptRoom;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    if (deptRoom == null) {
      return const Center(child: Text('Chưa có phòng nhóm cho phòng ban.'));
    }
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.forum, size: 48),
          const SizedBox(height: 12),
          Text(deptRoom!['name']?.toString() ?? 'Phòng ban'),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: onOpen,
            icon: const Icon(Icons.chat_bubble_outline),
            label: const Text('Mở phòng nhóm'),
          ),
        ],
      ),
    );
  }
}
