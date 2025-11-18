import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../core/api/api_client.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  bool loading = true;
  String? error;
  List<Map<String, dynamic>> records = [];

  // ==== FORMAT DATE (giống web) ====
  String _fmtDate(dynamic iso) {
    if (iso == null) return "–";
    final dt = DateTime.tryParse(iso.toString());
    if (dt == null) return "–";
    return "${dt.day.toString().padLeft(2, '0')}/"
        "${dt.month.toString().padLeft(2, '0')}/"
        "${dt.year}";
  }

  // ==== FORMAT TIME 24H (giống web) ====
  String _fmtTime(dynamic iso) {
    if (iso == null) return "–";
    final dt = DateTime.tryParse(iso.toString());
    if (dt == null) return "–";
    final hh = dt.hour.toString().padLeft(2, '0');
    final mm = dt.minute.toString().padLeft(2, '0');
    final ss = dt.second.toString().padLeft(2, '0');
    return "$hh:$mm:$ss"; // Web HIỂN THỊ FULL 24H
  }

  // ==== FORMAT NUMBER ====
  String _fmtNum(dynamic v) {
    if (v == null) return "0";
    final d = double.tryParse(v.toString()) ?? 0;
    return d.toStringAsFixed(2);
  }

  Future<void> _load() async {
    setState(() {
      loading = true;
      error = null;
    });

    try {
      final res = await ApiClient.instance.dio.get('/attendance');
      records = (res.data as List).cast<Map<String, dynamic>>();
    } on DioException catch (e) {
      error = e.response?.data?['error'] ?? "Lỗi tải dữ liệu";
    } finally {
      if (mounted) {
        setState(() => loading = false);
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("🕒 Lịch sử chấm công")),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (loading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
              ),

            if (!loading && error != null)
              Card(
                color: Colors.red.withOpacity(0.1),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    error!,
                    style: const TextStyle(color: Colors.red),
                  ),
                ),
              ),

            if (!loading && error == null) ...[
              // ==== BẢNG LỊCH SỬ GIỐNG WEB ====
              Card(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: DataTable(
                    headingRowColor: MaterialStateProperty.all(
                      Theme.of(context).colorScheme.surfaceVariant,
                    ),
                    columns: const [
                      DataColumn(label: Text("Ngày")),
                      DataColumn(label: Text("Giờ vào")),
                      DataColumn(label: Text("Giờ ra")),
                      DataColumn(label: Text("Đi trễ (phút)")),
                      DataColumn(label: Text("Tăng ca (giờ)")),
                      DataColumn(label: Text("Ngày công")),
                    ],
                    rows: records.map((r) {
                      return DataRow(cells: [
                        DataCell(Text(_fmtDate(r['date']))),
                        DataCell(Text(_fmtTime(r['checkIn']))),
                        DataCell(Text(_fmtTime(r['checkOut']))),
                        DataCell(Text("${r['lateMinutes'] ?? 0}")),
                        DataCell(Text(_fmtNum(r['overtimeHours']))),
                        DataCell(Text("${r['totalDays'] ?? 0}")),
                      ]);
                    }).toList(),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
