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
  List<dynamic> records = [];
  Map<String, dynamic>? today;

  Future<void> _load() async {
    setState(() { loading = true; error = null; });
    try {
      final res = await ApiClient.instance.dio.get('/attendance'); // KHỚP backend
      final data = (res.data as List).cast<Map<String, dynamic>>();
      records = data;
      final todayStr = DateTime.now().toIso8601String().split('T').first;
      today = data.where((r) => r['date'] == todayStr).cast<Map<String, dynamic>?>().firstOrNull ?? {};
    } on DioException catch (e) {
      error = e.response?.data?['error']?.toString() ?? 'Lỗi tải dữ liệu';
    } finally {
      if (mounted) setState(() { loading = false; });
    }
  }

  Future<void> _checkIn() async {
    try {
      await ApiClient.instance.dio.post('/attendance/check-in');
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✅ Check-in thành công')));
      await _load();
    } on DioException catch (e) {
      _err(e.response?.data?['error']?.toString() ?? '❌ Lỗi check-in');
    }
  }

  Future<void> _startOt() async {
    try {
      await ApiClient.instance.dio.post('/attendance/overtime');
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✅ Bắt đầu tăng ca')));
      await _load();
    } on DioException catch (e) {
      _err(e.response?.data?['error']?.toString() ?? '❌ Lỗi tăng ca');
    }
  }

  Future<void> _endOt() async {
    try {
      await ApiClient.instance.dio.post('/attendance/overtime/checkout');
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('⏹ Kết thúc tăng ca')));
      await _load();
    } on DioException catch (e) {
      _err(e.response?.data?['error']?.toString() ?? '❌ Lỗi kết thúc tăng ca');
    }
  }

  void _err(String m) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));

  String _t(dynamic iso) {
    if (iso == null) return '—';
    final dt = DateTime.tryParse(iso.toString());
    return (dt == null) ? '—' : TimeOfDay.fromDateTime(dt).format(context);
  }

  @override
  void initState() { super.initState(); _load(); }

  @override
  Widget build(BuildContext context) {
    final t = today ?? {};
    return Scaffold(
      appBar: AppBar(title: const Text('🕒 Chấm công')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (loading) const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator())),
            if (!loading && error != null)
              Card(color: Colors.red.withOpacity(0.08), child: Padding(
                padding: const EdgeInsets.all(16), child: Text(error!, style: const TextStyle(color: Colors.red)),
              )),
            if (!loading && error == null) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('📅 Hôm nay: ${t['date'] ?? DateTime.now().toIso8601String().split('T').first}',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text('✅ Check-in: ${_t(t['checkIn'])}'),
                    Text('🕓 Check-out: ${_t(t['checkOut'])}'),
                    Text('⏳ Đi trễ: ${(t['lateMinutes'] ?? 0).toString()} phút'),
                    Text('⏰ Tăng ca: ${(t['overtimeHours'] ?? 0).toString()} giờ'),
                    Text('📈 Ngày công: ${(t['totalDays'] ?? 0).toString()}'),
                    const SizedBox(height: 12),
                    Wrap(spacing: 8, runSpacing: 8, children: [
                      ElevatedButton.icon(
                        onPressed: (t['checkIn'] == null) ? _checkIn : null,
                        icon: const Icon(Icons.login), label: const Text('Check-in'),
                      ),
                      ElevatedButton.icon(
                        onPressed: (t['checkIn'] != null && t['overtimeStart'] == null) ? _startOt : null,
                        icon: const Icon(Icons.timer), label: const Text('Bắt đầu tăng ca'),
                      ),
                      ElevatedButton.icon(
                        onPressed: (t['overtimeStart'] != null) ? _endOt : null,
                        icon: const Icon(Icons.stop_circle_outlined), label: const Text('Kết thúc tăng ca'),
                      ),
                    ]),
                  ]),
                ),
              ),
              const SizedBox(height: 12),
              Text('📜 Lịch sử chấm công', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Card(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: DataTable(
                    columns: const [
                      DataColumn(label: Text('Ngày')),
                      DataColumn(label: Text('Vào')),
                      DataColumn(label: Text('Ra')),
                      DataColumn(label: Text('Trễ (p)')),
                      DataColumn(label: Text('OT (h)')),
                      DataColumn(label: Text('Ngày công')),
                    ],
                    rows: records.take(90).map((m) {
                      return DataRow(cells: [
                        DataCell(Text(m['date']?.toString() ?? '')),
                        DataCell(Text(_t(m['checkIn']))),
                        DataCell(Text(_t(m['checkOut']))),
                        DataCell(Text('${m['lateMinutes'] ?? 0}')),
                        DataCell(Text('${m['overtimeHours'] ?? 0}')),
                        DataCell(Text('${m['totalDays'] ?? 0}')),
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

extension FirstOrNull<E> on Iterable<E> {
  E? get firstOrNull => isEmpty ? null : first;
}
