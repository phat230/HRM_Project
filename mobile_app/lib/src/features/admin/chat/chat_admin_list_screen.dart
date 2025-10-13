import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import 'chat_admin_room_screen.dart';

class ChatAdminListScreen extends StatefulWidget {
  const ChatAdminListScreen({super.key});

  @override
  State<ChatAdminListScreen> createState() => _ChatAdminListScreenState();
}

class _ChatAdminListScreenState extends State<ChatAdminListScreen> {
  bool loading = true;
  String? error;

  List deptPeers = [];
  List allPeers = [];
  Map<String, dynamic>? deptRoom;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      loading = true;
      error = null;
    });

    try {
      // ====================== DEPT ======================
      print('📡 Gọi API: /employees/peers?scope=dept');
      final resDept = await ApiClient.instance.dio.get(
        '/employees/peers', // ❌ bỏ /api
        queryParameters: {'scope': 'dept'},
      );
      print('✅ deptPeers: ${resDept.data}');
      deptPeers = (resDept.data as List? ?? []);

      // ====================== ALL ======================
      print('📡 Gọi API: /employees/peers?scope=all');
      final resAll = await ApiClient.instance.dio.get(
        '/employees/peers', // ❌ bỏ /api
        queryParameters: {'scope': 'all'},
      );
      print('✅ allPeers: ${resAll.data}');
      allPeers = (resAll.data as List? ?? []).where((u) {
        final id = (u as Map)['userId']?.toString();
        return !deptPeers.any(
          (x) => (x as Map)['userId']?.toString() == id,
        );
      }).toList();

      // ====================== ROOMS ======================
      print('📡 Gọi API: /messages/rooms');
      final resRooms = await ApiClient.instance.dio.get(
        '/messages/rooms', // ❌ bỏ /api
      );
      print('✅ rooms: ${resRooms.data}');
      final rooms = (resRooms.data as Map<String, dynamic>);
      deptRoom = rooms['deptRoom'] as Map<String, dynamic>?;

    } on DioException catch (e) {
      final status = e.response?.statusCode;
      final data = e.response?.data;

      print('❌ [ChatAdminListScreen] Lỗi tải dữ liệu');
      print('❌ StatusCode: $status');
      print('❌ Response: $data');

      if (status == 401) {
        error = '⚠️ Token hết hạn hoặc chưa đăng nhập (401)';
      } else if (status == 404) {
        error = '⚠️ API không tồn tại (404)';
      } else if (status == 500) {
        error = '⚠️ Lỗi máy chủ nội bộ (500)';
      } else {
        error = data?['error']?.toString() ?? '❌ Không thể tải dữ liệu chat';
      }

    } catch (e) {
      print('❌ [ChatAdminListScreen] Lỗi không xác định: $e');
      error = '❌ Lỗi không xác định';
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _openPrivateChat(Map peer) async {
    try {
      final res = await ApiClient.instance.dio.post(
        '/messages/rooms/private', // ❌ bỏ /api
        data: {'otherUserId': peer['userId']},
      );
      final room = res.data;
      if (!mounted) return;
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ChatAdminRoomScreen(
            roomId: room['_id'],
            title: peer['name'] ?? peer['username'],
            isGroup: false,
          ),
        ),
      );
    } on DioException catch (e) {
      print('❌ Lỗi mở phòng chat 1-1: ${e.response?.data}');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Không thể mở phòng chat 1-1')),
      );
    }
  }

  void _openGroupChat() {
    if (deptRoom == null) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ChatAdminRoomScreen(
          roomId: deptRoom!['_id'],
          title: deptRoom!['name'] ?? 'Phòng ban',
          isGroup: true,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('💬 Chat (Admin)'),
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.group), text: 'Cùng phòng'),
              Tab(icon: Icon(Icons.travel_explore), text: 'Ngoài phòng'),
              Tab(icon: Icon(Icons.forum), text: 'Nhóm'),
            ],
          ),
          actions: [
            IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
          ],
        ),
        body: loading
            ? const Center(child: CircularProgressIndicator())
            : (error != null)
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        error!,
                        style: const TextStyle(color: Colors.red),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  )
                : TabBarView(
                    children: [
                      _buildPeerList(deptPeers),
                      _buildPeerList(allPeers),
                      _buildGroupTab(),
                    ],
                  ),
      ),
    );
  }

  Widget _buildPeerList(List list) {
    if (list.isEmpty) {
      return const Center(child: Text('Không có nhân viên'));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: list.length,
      itemBuilder: (_, i) {
        final p = list[i] as Map;
        return Card(
          child: ListTile(
            leading: const CircleAvatar(child: Icon(Icons.person)),
            title: Text(p['name'] ?? p['username'] ?? '(không tên)'),
            subtitle: Text(p['department'] ?? ''),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _openPrivateChat(p),
          ),
        );
      },
    );
  }

  Widget _buildGroupTab() {
    if (deptRoom == null) {
      return const Center(child: Text('Chưa có phòng nhóm cho phòng ban'));
    }
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.forum, size: 48),
          const SizedBox(height: 12),
          Text(deptRoom!['name'] ?? 'Phòng ban'),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: _openGroupChat,
            icon: const Icon(Icons.chat_bubble_outline),
            label: const Text('Mở phòng nhóm'),
          ),
        ],
      ),
    );
  }
}
