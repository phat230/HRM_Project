import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../core/api/api_client.dart';

class WorkScheduleScreen extends StatefulWidget {
  const WorkScheduleScreen({super.key});
  @override
  State<WorkScheduleScreen> createState() => _WorkScheduleScreenState();
}

class _WorkScheduleScreenState extends State<WorkScheduleScreen> {
  bool loading = true;
  String? error;
  List<dynamic> schedules = [];

  Future<void> _load() async {
    setState(() { loading = true; error = null; });
    try {
      final res = await ApiClient.instance.dio.get('/work-schedule');
      schedules = (res.data is List) ? res.data : [];
    } on DioException catch (e) {
      error = e.response?.data?['error']?.toString() ?? 'Lỗi tải lịch';
    } finally {
      if (mounted) setState(() { loading = false; });
    }
  }

  @override
  void initState() { super.initState(); _load(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('📅 Lịch làm việc')),
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
              ...schedules.map((s) {
                final m = s as Map<String, dynamic>;
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.event_note),
                    title: Text(m['date']?.toString() ?? ''),
                    subtitle: Text('Ca: ${m['shift'] ?? '-'} · Ghi chú: ${m['note'] ?? '-'}'),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
