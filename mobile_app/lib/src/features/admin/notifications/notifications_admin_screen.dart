import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../widgets/admin_drawer.dart';
import '../../../core/utils/admin_guard.dart';

class NotificationsAdminScreen extends StatefulWidget {
  const NotificationsAdminScreen({super.key});

  @override
  State<NotificationsAdminScreen> createState() => _NotificationsAdminScreenState();
}

class _NotificationsAdminScreenState extends State<NotificationsAdminScreen> {
  bool loading = false;
  List notifications = [];
  final _titleCtrl = TextEditingController();
  final _contentCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await ApiClient.instance.dio.get('/admin/notifications');
      setState(() => notifications = res.data is List ? res.data : []);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Lỗi tải thông báo')),
      );
    } finally {
      setState(() => loading = false);
    }
  }

  Future<void> _addNotification() async {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Tạo thông báo mới'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _titleCtrl,
              decoration: const InputDecoration(labelText: 'Tiêu đề'),
            ),
            TextField(
              controller: _contentCtrl,
              decoration: const InputDecoration(labelText: 'Nội dung'),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Hủy')),
          FilledButton(
            onPressed: () async {
              await ApiClient.instance.dio.post('/admin/notifications', data: {
                'title': _titleCtrl.text.trim(),
                'content': _contentCtrl.text.trim(),
              });
              _titleCtrl.clear();
              _contentCtrl.clear();
              Navigator.pop(context);
              _load();
            },
            child: const Text('Gửi'),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteNotification(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Xóa thông báo'),
        content: const Text('Bạn có chắc muốn xóa thông báo này?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Hủy')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Xóa')),
        ],
      ),
    );
    if (confirm == true) {
      await ApiClient.instance.dio.delete('/admin/notifications/$id');
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return AdminGuard(
      child: Scaffold(
        appBar: AppBar(
          title: const Text('🔔 Quản lý thông báo'),
          actions: [
            IconButton(onPressed: _addNotification, icon: const Icon(Icons.add)),
          ],
        ),
        drawer: AdminDrawer(),
        body: loading
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: _load,
                child: notifications.isEmpty
                    ? const Center(child: Text('Chưa có thông báo'))
                    : ListView.builder(
                        itemCount: notifications.length,
                        itemBuilder: (context, index) {
                          final n = notifications[index];
                          return Card(
                            margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            child: ListTile(
                              title: Text(n['title'] ?? 'Không có tiêu đề'),
                              subtitle: Text(n['content'] ?? ''),
                              trailing: IconButton(
                                icon: const Icon(Icons.delete),
                                onPressed: () => _deleteNotification(n['_id']),
                              ),
                            ),
                          );
                        },
                      ),
              ),
      ),
    );
  }
}
