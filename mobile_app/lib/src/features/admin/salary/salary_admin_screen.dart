import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../widgets/admin_drawer.dart';
import '../../../core/utils/admin_guard.dart';

class SalaryAdminScreen extends StatefulWidget {
  const SalaryAdminScreen({super.key});

  @override
  State<SalaryAdminScreen> createState() => _SalaryAdminScreenState();
}

class _SalaryAdminScreenState extends State<SalaryAdminScreen> {
  bool loading = false;
  List salaries = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await ApiClient.instance.dio.get('/admin/salary');
      setState(() => salaries = res.data is List ? res.data : []);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Lỗi tải dữ liệu lương')),
      );
    } finally {
      setState(() => loading = false);
    }
  }

  Future<void> _editSalary(Map s) async {
    final daily = TextEditingController(text: s['dailyRate'].toString());
    final overtime = TextEditingController(text: s['overtimeRate'].toString());
    final allowance = TextEditingController(text: (s['allowance'] ?? 0).toString());

    await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('✏️ Sửa lương - ${s['userId']?['username']}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: daily,
              decoration: const InputDecoration(labelText: 'Lương cơ bản (VNĐ/ngày)'),
              keyboardType: TextInputType.number,
            ),
            TextField(
              controller: overtime,
              decoration: const InputDecoration(labelText: 'Tăng ca (VNĐ/giờ)'),
              keyboardType: TextInputType.number,
            ),
            TextField(
              controller: allowance,
              decoration: const InputDecoration(labelText: 'Phụ cấp (VNĐ)'),
              keyboardType: TextInputType.number,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Hủy')),
          FilledButton(
            onPressed: () async {
              await ApiClient.instance.dio.put('/admin/salary/${s['_id']}', data: {
                'dailyRate': int.tryParse(daily.text) ?? s['dailyRate'],
                'overtimeRate': int.tryParse(overtime.text) ?? s['overtimeRate'],
                'allowance': int.tryParse(allowance.text) ?? s['allowance'],
              });
              Navigator.pop(context);
              _load();
            },
            child: const Text('Lưu'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AdminGuard(
      child: Scaffold(
        appBar: AppBar(title: const Text('💰 Quản lý lương')),
        drawer: const AdminDrawer(),
        body: loading
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: _load,
                child: salaries.isEmpty
                    ? const Center(child: Text('Không có dữ liệu'))
                    : ListView.builder(
                        itemCount: salaries.length,
                        itemBuilder: (context, index) {
                          final s = salaries[index];
                          return Card(
                            margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            child: ListTile(
                              title: Text(s['userId']?['username'] ?? ''),
                              subtitle: Text(
                                'Cơ bản: ${s['dailyRate']}đ/ngày • Tăng ca: ${s['overtimeRate']}đ/giờ • Phụ cấp: ${s['allowance'] ?? 0}đ',
                              ),
                              trailing: IconButton(
                                icon: const Icon(Icons.edit),
                                onPressed: () => _editSalary(s),
                              ),
                            ),
                          );
                        },
                      ),
              ),
      ),
    );
  }
}
