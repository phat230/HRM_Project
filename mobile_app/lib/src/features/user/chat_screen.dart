import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import 'chat_room_screen.dart';

/// Màn chọn người/nhóm để nhắn giống Messenger:
/// - Tab 1: Trong phòng ban (1-1)
/// - Tab 2: Ngoài phòng ban (1-1)
/// - Tab 3: Nhóm phòng ban (group)
class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  bool loading = true;
  String? error;
  List<Map<String, dynamic>> peersDept = [];
  List<Map<String, dynamic>> peersAll = [];
  Map<String, dynamic>? deptRoom; // phòng nhóm theo phòng ban

  Future<void> _load() async {
    setState(() { loading = true; error = null; });
    try {
      // danh sách người trong phòng ban
      final r1 = await ApiClient.instance.dio.get('/employees/peers', queryParameters: {'scope': 'dept'});
      // danh sách người ngoài phòng ban (tất cả)
      final r2 = await ApiClient.instance.dio.get('/employees/peers', queryParameters: {'scope': 'all'});
      // phòng nhóm phòng ban (từ messageRoutes /rooms)
      final r3 = await ApiClient.instance.dio.get('/messages/rooms');

      peersDept = (r1.data as List).cast<Map>().map((e) => Map<String, dynamic>.from(e as Map)).toList();
      final all = (r2.data as List).cast<Map>().map((e) => Map<String, dynamic>.from(e as Map)).toList();
      // ngoài phòng ban = all – dept – bản thân (API đã lọc bản thân)
      final idsDept = peersDept.map((e) => e['userId']).toSet();
      peersAll = all.where((e) => !idsDept.contains(e['userId'])).toList();

      final rooms = Map<String, dynamic>.from(r3.data as Map<String, dynamic>);
      deptRoom = (rooms['deptRoom'] as Map?)?.cast<String, dynamic>();
    } on DioException catch (e) {
      error = e.response?.data?['error']?.toString() ?? 'Lỗi tải dữ liệu';
    } finally {
      if (mounted) setState(() { loading = false; });
    }
  }

  @override
  void initState() { super.initState(); _load(); }

  Widget _buildList(List<Map<String, dynamic>> items, {bool isGroup = false}) {
    if (loading) {
      return const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()));
    }
    if (error != null) {
      return Center(child: Text(error!, style: const TextStyle(color: Colors.red)));
    }
    if (isGroup) {
      final room = deptRoom;
      if (room == null) {
        return const Center(child: Text('Chưa có phòng ban.'));
      }
      return ListView(
        children: [
          ListTile(
            leading: const CircleAvatar(child: Icon(Icons.groups)),
            title: Text(room['name']?.toString() ?? 'Phòng ban'),
            subtitle: Text('Phòng: ${room['department'] ?? '-'}'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => ChatRoomScreen(
                  roomId: room['_id']?.toString() ?? '',
                  roomType: ChatRoomType.group,
                  displayName: room['name']?.toString() ?? 'Phòng ban',
                  department: room['department']?.toString(),
                ),
              ));
            },
          ),
        ],
      );
    }
    if (items.isEmpty) {
      return const Center(child: Text('Không có người phù hợp.'));
    }
    return ListView.separated(
      itemCount: items.length,
      separatorBuilder: (_, __) => const Divider(height: 0),
      itemBuilder: (_, i) {
        final u = items[i];
        final name = (u['name'] ?? u['username'] ?? '').toString();
        return ListTile(
          leading: const CircleAvatar(child: Icon(Icons.person)),
          title: Text(name.isEmpty ? '(Không tên)' : name),
          subtitle: Text('Phòng: ${u['department'] ?? '-'}'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () async {
            // tạo/mở phòng private
            final res = await ApiClient.instance.dio.post('/messages/rooms/private', data: {
              'otherUserId': u['userId']
            });
            final room = Map<String, dynamic>.from(res.data as Map);
            if (!mounted) return;
            Navigator.of(context).push(MaterialPageRoute(
              builder: (_) => ChatRoomScreen(
                roomId: room['_id']?.toString() ?? '',
                roomType: ChatRoomType.private,
                displayName: name,
                peerUserId: u['userId']?.toString(),
              ),
            ));
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('💬 Chat'),
          bottom: const TabBar(
            isScrollable: true,
            tabs: [
              Tab(icon: Icon(Icons.group), text: 'Nhóm phòng ban'),
              Tab(icon: Icon(Icons.person), text: 'Trong phòng ban'),
              Tab(icon: Icon(Icons.public), text: 'Ngoài phòng ban'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildList(const [], isGroup: true), // nhóm phòng ban
            _buildList(peersDept),
            _buildList(peersAll),
          ],
        ),
      ),
    );
  }
}
