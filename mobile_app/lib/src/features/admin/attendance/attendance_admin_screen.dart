import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../widgets/admin_drawer.dart';
import '../../../core/utils/admin_guard.dart';

class AttendanceAdminScreen extends StatefulWidget {
  const AttendanceAdminScreen({super.key});

  @override
  State<AttendanceAdminScreen> createState() => _AttendanceAdminScreenState();
}

class _AttendanceAdminScreenState extends State<AttendanceAdminScreen> {
  bool loading = false;
  List records = [];
  final searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({String? keyword}) async {
    setState(() => loading = true);
    try {
      final res = await ApiClient.instance.dio.get(
        '/admin/attendance',
        queryParameters: keyword != null && keyword.isNotEmpty
            ? {'search': keyword}
            : null,
      );
      setState(() => records = res.data is List ? res.data : []);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Lỗi tải dữ liệu chấm công')),
      );
    } finally {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AdminGuard(
      child: Scaffold(
        appBar: AppBar(
          title: const Text('🕒 Quản lý chấm công'),
        ),
        drawer: const AdminDrawer(),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(8),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: searchController,
                      decoration: const InputDecoration(
                        hintText: 'Tìm theo tên hoặc ngày...',
                        prefixIcon: Icon(Icons.search),
                        border: OutlineInputBorder(),
                      ),
                      onSubmitted: (v) => _load(keyword: v),
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(
                    onPressed: () => _load(keyword: searchController.text),
                    child: const Text('Tìm'),
                  )
                ],
              ),
            ),
            Expanded(
              child: loading
                  ? const Center(child: CircularProgressIndicator())
                  : RefreshIndicator(
                      onRefresh: () => _load(keyword: searchController.text),
                      child: records.isEmpty
                          ? const Center(child: Text('Chưa có bản ghi chấm công'))
                          : ListView.builder(
                              itemCount: records.length,
                              itemBuilder: (context, i) {
                                final r = records[i];
                                final name = r['userId']?['username'] ?? 'N/A';
                                final status = r['status'] ?? 'Chưa rõ';
                                final date = r['date'] ?? '';
                                return Card(
                                  margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  child: ListTile(
                                    title: Text(name),
                                    subtitle: Text('Ngày: $date\nTrạng thái: $status'),
                                  ),
                                );
                              },
                            ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
