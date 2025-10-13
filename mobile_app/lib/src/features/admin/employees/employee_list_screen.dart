import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../widgets/admin_drawer.dart';
import 'employee_form_dialog.dart';
import '../../../core/utils/admin_guard.dart';

class EmployeeListScreen extends StatefulWidget {
  const EmployeeListScreen({super.key});

  @override
  State<EmployeeListScreen> createState() => _EmployeeListScreenState();
}

class _EmployeeListScreenState extends State<EmployeeListScreen> {
  bool loading = false;
  List<Map<String, dynamic>> employees = []; // ✅ kiểu dữ liệu rõ ràng

  @override
  void initState() {
    super.initState();
    _load();
  }

  /// =============================
  /// 📥 Load danh sách nhân viên
  /// =============================
  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await ApiClient.instance.dio.get('/admin/employees');
      if (res.data is List) {
        setState(() => employees = List<Map<String, dynamic>>.from(res.data));
      } else {
        setState(() => employees = []);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Lỗi tải danh sách nhân viên')),
      );
    } finally {
      setState(() => loading = false);
    }
  }

  /// =============================
  /// ➕ Thêm nhân viên mới
  /// =============================
  Future<void> _add() async {
    await showDialog(
      context: context,
      builder: (_) => EmployeeFormDialog(
        onSubmit: (data) async {
          await ApiClient.instance.dio.post('/admin/employees', data: data);
          _load();
        },
      ),
    );
  }

  /// =============================
  /// ✏️ Sửa thông tin nhân viên
  /// =============================
  Future<void> _edit(Map<String, dynamic> emp) async {
    await showDialog(
      context: context,
      builder: (_) => EmployeeFormDialog(
        initialData: Map<String, dynamic>.from(emp), // ✅ ép kiểu chuẩn
        onSubmit: (data) async {
          await ApiClient.instance.dio.put(
            '/admin/employees/${emp['_id']}',
            data: data,
          );
          _load();
        },
      ),
    );
  }

  /// =============================
  /// 🗑️ Xóa nhân viên
  /// =============================
  Future<void> _delete(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Xóa nhân viên'),
        content: const Text('Bạn có chắc muốn xóa nhân viên này không?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Hủy'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );
    if (confirm == true) {
      await ApiClient.instance.dio.delete('/admin/employees/$id');
      _load();
    }
  }

  /// =============================
  /// 🖼️ Giao diện
  /// =============================
  @override
  Widget build(BuildContext context) {
    return AdminGuard(
      child: Scaffold(
        appBar: AppBar(
          title: const Text('👨‍💼 Quản lý nhân viên'),
          actions: [
            IconButton(
              onPressed: _add,
              icon: const Icon(Icons.add),
              tooltip: 'Thêm nhân viên',
            )
          ],
        ),
        drawer: const AdminDrawer(),
        body: loading
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: _load,
                child: employees.isEmpty
                    ? const Center(child: Text('Chưa có nhân viên'))
                    : ListView.builder(
                        itemCount: employees.length,
                        itemBuilder: (context, index) {
                          final emp = employees[index];
                          final username = emp['userId']?['username'] ?? '';
                          final role = emp['userId']?['role'] ?? '';
                          final name = emp['name'] ?? '';
                          final dept = emp['department'] ?? '';
                          final pos = emp['position'] ?? '';

                          return Card(
                            margin: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            child: ListTile(
                              title: Text('$name ($username)'),
                              subtitle: Text('$dept • $pos • Role: $role'),
                              trailing: PopupMenuButton<String>(
                                onSelected: (v) {
                                  if (v == 'edit') _edit(emp);
                                  if (v == 'delete') _delete(emp['_id']);
                                },
                                itemBuilder: (_) => const [
                                  PopupMenuItem(
                                    value: 'edit',
                                    child: Row(
                                      children: [
                                        Icon(Icons.edit, size: 18),
                                        SizedBox(width: 6),
                                        Text('Sửa'),
                                      ],
                                    ),
                                  ),
                                  PopupMenuItem(
                                    value: 'delete',
                                    child: Row(
                                      children: [
                                        Icon(Icons.delete, size: 18),
                                        SizedBox(width: 6),
                                        Text('Xóa'),
                                      ],
                                    ),
                                  ),
                                ],
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
