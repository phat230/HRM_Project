import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../core/api/api_client.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool loading = true;
  String? error;
  List<dynamic> noti = [];

  Future<void> _load() async {
    setState(() { loading = true; error = null; });
    try {
      final res = await ApiClient.instance.dio.get('/notifications'); // ← KHỚP backend
      noti = (res.data is List) ? res.data : [];
    } on DioException catch (e) {
      error = e.response?.data?['error']?.toString() ?? 'Lỗi tải thông báo';
    } finally {
      if (mounted) setState(() { loading = false; });
    }
  }

  @override
  void initState() { super.initState(); _load(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('🔔 Thông báo')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (loading) const Center(child: Padding(
              padding: EdgeInsets.all(24), child: CircularProgressIndicator(),
            )),
            if (!loading && error != null)
              Card(color: Colors.red.withOpacity(0.08), child: Padding(
                padding: const EdgeInsets.all(16), child: Text(error!, style: const TextStyle(color: Colors.red)),
              )),
            if (!loading && error == null)
              ...noti.map((n) {
                final m = n as Map<String, dynamic>;
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.notifications),
                    title: Text(m['title']?.toString() ?? '(Không tiêu đề)'),
                    subtitle: Text(m['message']?.toString() ?? ''),
                    trailing: Text(m['createdAt']?.toString().split('T').first ?? ''),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
