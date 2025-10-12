import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../core/api/api_client.dart';
import 'package:intl/intl.dart';

class SalaryScreen extends StatefulWidget {
  const SalaryScreen({super.key});
  @override
  State<SalaryScreen> createState() => _SalaryScreenState();
}

class _SalaryScreenState extends State<SalaryScreen> {
  bool loading = true;
  String? error;
  List<dynamic> items = [];
  final fmt = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');

  Future<void> _load() async {
    setState(() { loading = true; error = null; });
    try {
      final res = await ApiClient.instance.dio.get('/salary/me');
      items = (res.data is List) ? res.data : [];
    } on DioException catch (e) {
      error = e.response?.data?['error']?.toString() ?? 'Lỗi tải lương';
    } finally {
      if (mounted) setState(() { loading = false; });
    }
  }

  @override
  void initState() { super.initState(); _load(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('💰 Lương cá nhân')),
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
              Card(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: DataTable(
                    columns: const [
                      DataColumn(label: Text('Ngày công')),
                      DataColumn(label: Text('Phạt')),
                      DataColumn(label: Text('OT (h)')),
                      DataColumn(label: Text('Tiền ngày')),
                      DataColumn(label: Text('Tiền OT/h')),
                      DataColumn(label: Text('Tổng lương')),
                    ],
                    rows: items.map((s) {
                      final m = s as Map<String, dynamic>;
                      return DataRow(cells: [
                        DataCell(Text('${m['totalDays'] ?? 0}')),
                        DataCell(Text(fmt.format(m['penalty'] ?? 0))),
                        DataCell(Text('${m['overtimeHours'] ?? 0}')),
                        DataCell(Text(fmt.format(m['dailyRate'] ?? 0))),
                        DataCell(Text(fmt.format(m['overtimePay'] ?? 0))),
                        DataCell(Text(fmt.format(m['amount'] ?? 0))),
                      ]);
                    }).toList(),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
