import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../core/utils/admin_guard.dart';
import '../../../widgets/admin_drawer.dart';

class ReportAdminScreen extends StatefulWidget {
  const ReportAdminScreen({super.key});

  @override
  State<ReportAdminScreen> createState() => _ReportAdminScreenState();
}

class _ReportAdminScreenState extends State<ReportAdminScreen> {
  bool loading = false;
  String? error;
  List reports = [];

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
      // Web dùng GET /report
      final res = await ApiClient.instance.dio.get('/report');

      // Chuẩn hoá dữ liệu (đề phòng username trả về là ObjectId)
      final List data = (res.data is List) ? res.data : [];
      final cleaned = data.map((r) {
        final username = (r['username'] is Map || r['username'] is List) ? '' : (r['username']?.toString() ?? '');
        return {
          'name': r['name'] ?? '',
          'username': username,
          'department': r['department'] ?? '',
          'position': r['position'] ?? '',
          'totalHours': (r['totalHours'] is num) ? r['totalHours'] : 0,
          'totalLeaves': (r['totalLeaves'] is num) ? r['totalLeaves'] : 0,
          'avgScore': r['avgScore'] ?? '-',
        };
      }).toList();

      setState(() => reports = cleaned);
    } catch (e) {
      setState(() => error = 'Không tải được dữ liệu báo cáo');
    } finally {
      setState(() => loading = false);
    }
  }

  String _fmtNum(num? v, {int digits = 2}) {
    if (v == null) return '–';
    if (v == 0) return '0';
    return v.toStringAsFixed(digits);
  }

  @override
  Widget build(BuildContext context) {
    return AdminGuard(
      child: Scaffold(
        appBar: AppBar(title: const Text('📊 Báo cáo tổng hợp')),
        drawer: AdminDrawer(),
        body: loading
            ? const Center(child: CircularProgressIndicator())
            : error != null
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(error!, style: const TextStyle(color: Colors.red)),
                        const SizedBox(height: 8),
                        FilledButton(onPressed: _load, child: const Text('Thử lại')),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _load,
                    child: reports.isEmpty
                        ? const Center(child: Text('Chưa có dữ liệu báo cáo'))
                        : ListView(
                            padding: const EdgeInsets.all(12),
                            children: [
                              Card(
                                child: SingleChildScrollView(
                                  scrollDirection: Axis.horizontal,
                                  child: DataTable(
                                    columns: const [
                                      DataColumn(label: Text('Nhân viên')),
                                      DataColumn(label: Text('Phòng ban')),
                                      DataColumn(label: Text('Chức vụ')),
                                      DataColumn(label: Text('Tổng giờ')),
                                      DataColumn(label: Text('Tổng ngày nghỉ')),
                                      DataColumn(label: Text('Hiệu suất TB')),
                                    ],
                                    rows: reports.map<DataRow>((r) {
                                      final nameAndUser = r['username'] != ''
                                          ? '${r['name']} (${r['username']})'
                                          : (r['name'] ?? '');
                                      return DataRow(
                                        cells: [
                                          DataCell(Text(nameAndUser)),
                                          DataCell(Text(r['department'] ?? '')),
                                          DataCell(Text(r['position'] ?? '')),
                                          DataCell(Text(_fmtNum(r['totalHours']))),
                                          DataCell(Text('${r['totalLeaves'] ?? 0}')),
                                          DataCell(Text(r['avgScore']?.toString() ?? '-')),
                                        ],
                                      );
                                    }).toList(),
                                  ),
                                ),
                              ),
                            ],
                          ),
                  ),
      ),
    );
  }
}
