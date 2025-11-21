import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_providers.dart'; 
class AttendanceByEmployee extends StatefulWidget {
  final String employeeId;
  final String name;
  final String department;

  const AttendanceByEmployee({
    super.key,
    required this.employeeId,
    required this.name,
    required this.department,
  });

  @override
  State<AttendanceByEmployee> createState() => _AttendanceByEmployeeState();
}

class _AttendanceByEmployeeState extends State<AttendanceByEmployee> {
  bool loading = true;
  String? error;
  List<Map<String, dynamic>> records = [];

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await ApiClient.instance.dio
          .get('/manager/attendance/${widget.employeeId}');
      records =
          (res.data as List).map((e) => Map<String, dynamic>.from(e)).toList();
    } on DioException catch (e) {
      error = e.response?.data?['error'] ?? "Lỗi tải dữ liệu";
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _checkIn() async {
    try {
      await ApiClient.instance.dio.post(
        '/manager/attendance/${widget.employeeId}/check-in',
      );

      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text("✔ Đã chấm giờ vào")));
        _load();
      }
    } catch (_) {}
  }

  Future<void> _checkOut() async {
    try {
      await ApiClient.instance.dio.post(
        '/manager/attendance/${widget.employeeId}/check-out',
      );

      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text("✔ Đã chấm giờ ra")));
        _load();
      }
    } catch (_) {}
  }

  String _fmt(d) {
    if (d == null) return "-";
    final t = DateTime.tryParse(d.toString());
    if (t == null) return "-";
    return "${t.hour.toString().padLeft(2, "0")}:${t.minute.toString().padLeft(2, "0")}:${t.second.toString().padLeft(2, "0")}";
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("${widget.name} — ${widget.department}"),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                FilledButton.icon(
                  onPressed: _checkIn,
                  icon: const Icon(Icons.login),
                  label: const Text("Chấm vào"),
                ),
                FilledButton.icon(
                  onPressed: _checkOut,
                  icon: const Icon(Icons.logout),
                  label: const Text("Chấm ra"),
                ),
              ],
            ),
            const SizedBox(height: 20),

            if (loading)
              const Center(child: CircularProgressIndicator()),

            if (!loading && error != null)
              Text(error!, style: const TextStyle(color: Colors.red)),

            if (!loading && error == null)
              ...records.map((r) {
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.access_time),
                    title: Text(r["date"] ?? "-"),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Giờ vào: ${_fmt(r['checkIn'])}"),
                        Text("Giờ ra: ${_fmt(r['checkOut'])}"),
                      ],
                    ),
                  ),
                );
              })
          ],
        ),
      ),
    );
  }
}
