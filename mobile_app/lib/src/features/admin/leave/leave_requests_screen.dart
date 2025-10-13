import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../widgets/admin_drawer.dart';
import '../../../core/utils/admin_guard.dart';

class LeaveRequestsScreen extends StatefulWidget {
  const LeaveRequestsScreen({super.key});

  @override
  State<LeaveRequestsScreen> createState() => _LeaveRequestsScreenState();
}

class _LeaveRequestsScreenState extends State<LeaveRequestsScreen> {
  bool loading = false;
  List leaves = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await ApiClient.instance.dio.get('/admin/leave-requests');
      setState(() => leaves = res.data is List ? res.data : []);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Lỗi tải danh sách nghỉ phép')),
      );
    } finally {
      setState(() => loading = false);
    }
  }

  Future<void> _act(String id, String type) async {
    try {
      await ApiClient.instance.dio.put('/admin/leave-requests/$id/$type');
      _load();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Lỗi cập nhật trạng thái')),
      );
    }
  }

  String _formatDate(String? iso) {
    if (iso == null) return '-';
    final d = DateTime.tryParse(iso);
    if (d == null) return '-';
    return '${d.day}/${d.month}/${d.year}';
  }

  @override
  Widget build(BuildContext context) {
    return AdminGuard(
      child: Scaffold(
        appBar: AppBar(title: const Text('📌 Duyệt nghỉ phép')),
        drawer: const AdminDrawer(),
        body: loading
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: _load,
                child: leaves.isEmpty
                    ? const Center(child: Text('Không có đơn nghỉ phép'))
                    : ListView.builder(
                        itemCount: leaves.length,
                        itemBuilder: (context, index) {
                          final l = leaves[index];
                          final username = l['userId']?['username'] ?? '';
                          final status = l['status'] ?? 'pending';

                          Color color;
                          String label;
                          switch (status) {
                            case 'approved':
                              color = Colors.green;
                              label = '✅ Đã duyệt';
                              break;
                            case 'rejected':
                              color = Colors.red;
                              label = '❌ Từ chối';
                              break;
                            default:
                              color = Colors.orange;
                              label = '⏳ Chờ duyệt';
                          }

                          return Card(
                            margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            child: ListTile(
                              title: Text(username),
                              subtitle: Text(
                                'Từ: ${_formatDate(l['startDate'])} → Đến: ${_formatDate(l['endDate'])}\nLý do: ${l['reason'] ?? ''}',
                              ),
                              trailing: status == 'pending'
                                  ? Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        IconButton(
                                          tooltip: 'Duyệt',
                                          icon: const Icon(Icons.check, color: Colors.green),
                                          onPressed: () => _act(l['_id'], 'approve'),
                                        ),
                                        IconButton(
                                          tooltip: 'Từ chối',
                                          icon: const Icon(Icons.close, color: Colors.red),
                                          onPressed: () => _act(l['_id'], 'reject'),
                                        ),
                                      ],
                                    )
                                  : Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold)),
                            ),
                          );
                        },
                      ),
              ),
      ),
    );
  }
}
