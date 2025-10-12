import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../core/api/api_client.dart';

class LeaveHistoryScreen extends StatefulWidget {
  const LeaveHistoryScreen({super.key});
  @override
  State<LeaveHistoryScreen> createState() => _LeaveHistoryScreenState();
}

class _LeaveHistoryScreenState extends State<LeaveHistoryScreen> {
  bool loading = true;
  String? error;
  List<dynamic> items = [];

  Future<void> _load() async {
    setState(() { loading = true; error = null; });
    try {
      final res = await ApiClient.instance.dio.get('/leave-requests/me');
      items = (res.data is List) ? res.data : [];
    } on DioException catch (e) {
      error = e.response?.data?['error']?.toString() ?? 'Lỗi tải lịch sử';
    } finally {
      if (mounted) setState(() { loading = false; });
    }
  }

  @override
  void initState() { super.initState(); _load(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('🗂️ Lịch sử đơn nghỉ')),
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
              ...items.map((it) {
                final m = it as Map<String, dynamic>;
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.sticky_note_2_outlined),
                    title: Text('${m['from']} → ${m['to']}'),
                    subtitle: Text('Lý do: ${m['reason'] ?? '-'} · Trạng thái: ${m['status'] ?? 'pending'}'),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
