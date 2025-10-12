import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../core/api/api_client.dart';

class UserDashboardScreen extends StatefulWidget {
  const UserDashboardScreen({super.key});
  @override
  State<UserDashboardScreen> createState() => _UserDashboardScreenState();
}

class _UserDashboardScreenState extends State<UserDashboardScreen> {
  bool loading = true;
  String? error;
  Map<String, dynamic> summary = {};

  Future<void> _load() async {
    setState(() { loading = true; error = null; });
    try {
      final res = await ApiClient.instance.dio.get('/report/me'); // ← KHỚP backend
      summary = (res.data is Map) ? (res.data as Map<String, dynamic>) : {};
    } on DioException catch (e) {
      error = e.response?.data?['error']?.toString() ?? 'Lỗi tải dashboard';
    } finally {
      if (mounted) setState(() { loading = false; });
    }
  }

  @override
  void initState() { super.initState(); _load(); }

  Widget _tile(String title, String value, IconData icon) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        trailing: Text(value, style: Theme.of(context).textTheme.titleLarge),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tổng quan')),
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
            if (!loading && error == null) ...[
              _tile('Ngày công tháng này', '${summary['totalHours'] ?? 0}', Icons.calendar_month),
              _tile('Giờ tăng ca', '${summary['tasksCompleted'] ?? 0}', Icons.timer_outlined),
              _tile('Điểm TB hiệu suất', '${summary['avgScore'] ?? 0}', Icons.star_half),
              _tile('Số tài liệu tải', '${summary['docsDownloaded'] ?? 0}', Icons.insert_drive_file),
              _tile('Tổng đơn nghỉ', '${summary['totalLeaves'] ?? 0}', Icons.event_busy),
            ],
          ],
        ),
      ),
    );
  }
}
