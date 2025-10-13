import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../widgets/admin_drawer.dart';
import 'employee_form_dialog.dart';
import '../../../core/utils/admin_guard.dart';

class EmployeeDetailScreen extends StatefulWidget {
  final String employeeId;
  const EmployeeDetailScreen({super.key, required this.employeeId});

  @override
  State<EmployeeDetailScreen> createState() => _EmployeeDetailScreenState();
}

class _EmployeeDetailScreenState extends State<EmployeeDetailScreen> {
  bool loading = false;
  Map<String, dynamic>? employee;

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    setState(() => loading = true);
    try {
      final res = await ApiClient.instance.dio.get('/admin/employees/${widget.employeeId}');
      setState(() => employee = res.data);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Không thể tải chi tiết nhân viên')),
      );
    } finally {
      setState(() => loading = false);
    }
  }

  Future<void> _editEmployee() async {
    if (employee == null) return;
    await showDialog(
      context: context,
      builder: (_) => EmployeeFormDialog(
        initialData: employee!,
        onSubmit: (data) async {
          await ApiClient.instance.dio.put('/admin/employees/${employee!['_id']}', data: data);
          _loadDetail();
        },
      ),
    );
  }

  Future<void> _deleteEmployee() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Xóa nhân viên'),
        content: const Text('Bạn có chắc muốn xóa nhân viên này không?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Hủy')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Xóa')),
        ],
      ),
    );
    if (confirm == true) {
      await ApiClient.instance.dio.delete('/admin/employees/${widget.employeeId}');
      if (mounted) Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AdminGuard(
      child: Scaffold(
        appBar: AppBar(
          title: const Text('📄 Chi tiết nhân viên'),
          actions: [
            IconButton(
              icon: const Icon(Icons.edit),
              tooltip: 'Sửa thông tin',
              onPressed: _editEmployee,
            ),
            IconButton(
              icon: const Icon(Icons.delete),
              tooltip: 'Xóa nhân viên',
              onPressed: _deleteEmployee,
            ),
          ],
        ),
        drawer: const AdminDrawer(),
        body: loading
            ? const Center(child: CircularProgressIndicator())
            : employee == null
                ? const Center(child: Text('Không tìm thấy nhân viên'))
                : RefreshIndicator(
                    onRefresh: _loadDetail,
                    child: ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        CircleAvatar(
                          radius: 40,
                          backgroundColor: Colors.indigo.shade100,
                          child: const Icon(Icons.person, size: 40, color: Colors.indigo),
                        ),
                        const SizedBox(height: 16),
                        Center(
                          child: Text(
                            employee?['name'] ?? '—',
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Center(
                          child: Text(
                            '@${employee?['userId']?['username'] ?? ''}',
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                        ),
                        const Divider(height: 32),
                        _infoRow('Phòng ban', employee?['department']),
                        _infoRow('Chức vụ', employee?['position']),
                        _infoRow('Email', employee?['userId']?['email']),
                        _infoRow('Vai trò', employee?['userId']?['role']),
                        _infoRow('Ngày tạo', _formatDate(employee?['userId']?['createdAt'])),
                        const Divider(height: 32),
                        // Thông tin lương
                        if (employee?['salary'] != null) ...[
                          const Text('💰 Thông tin lương',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 8),
                          _infoRow('Lương cơ bản', '${employee?['salary']?['dailyRate']} VNĐ/ngày'),
                          _infoRow('Tăng ca', '${employee?['salary']?['overtimeRate']} VNĐ/giờ'),
                          _infoRow('Phụ cấp', '${employee?['salary']?['allowance'] ?? 0} VNĐ'),
                        ],
                        const Divider(height: 32),
                        ElevatedButton.icon(
                          onPressed: () {
                            // sau này có thể chuyển tới trang chấm công
                            Navigator.pushNamed(context, '/admin/attendance');
                          },
                          icon: const Icon(Icons.timer),
                          label: const Text('Xem lịch sử chấm công'),
                        ),
                      ],
                    ),
                  ),
      ),
    );
  }

  Widget _infoRow(String label, String? value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
              flex: 2,
              child: Text(
                label,
                style: const TextStyle(fontWeight: FontWeight.w600),
              )),
          Expanded(
              flex: 3,
              child: Text(
                value ?? '—',
                style: TextStyle(color: Colors.grey[700]),
              )),
        ],
      ),
    );
  }

  String _formatDate(String? date) {
    if (date == null) return '—';
    try {
      final d = DateTime.parse(date);
      return '${d.day}/${d.month}/${d.year}';
    } catch (_) {
      return '—';
    }
  }
}
