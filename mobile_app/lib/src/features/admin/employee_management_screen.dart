import 'package:flutter/material.dart';
import '../../core/api/api_client.dart';

class EmployeeManagementScreen extends StatefulWidget {
  const EmployeeManagementScreen({super.key});

  @override
  State<EmployeeManagementScreen> createState() => _EmployeeManagementScreenState();
}

class _EmployeeManagementScreenState extends State<EmployeeManagementScreen> {
  List<dynamic> employees = [];
  bool loading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final res = await ApiClient.instance.dio.get('/employees');
      employees = (res.data as List).toList();
    } catch (e) {
      error = 'Không tải được danh sách nhân viên';
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    if (error != null) return Center(child: Text(error!));
    return RefreshIndicator(
      onRefresh: _fetch,
      child: ListView.builder(
        padding: const EdgeInsets.all(8),
        itemCount: employees.length,
        itemBuilder: (_, i) {
          final e = employees[i] as Map<String, dynamic>;
          return Card(
            child: ListTile(
              leading: const CircleAvatar(child: Icon(Icons.person)),
              title: Text(e['fullName']?.toString() ?? 'No name'),
              subtitle: Text('Email: ${e['email'] ?? '-'} — Dept: ${e['department'] ?? '-'}'),
              trailing: IconButton(icon: const Icon(Icons.edit), onPressed: () {}),
            ),
          );
        },
      ),
    );
  }
}
