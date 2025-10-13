import 'package:flutter/material.dart';
import '../../../core/utils/admin_guard.dart';

class EmployeeFormDialog extends StatefulWidget {
  final Map<String, dynamic>? initialData;
  final Future<void> Function(Map<String, dynamic>) onSubmit;

  const EmployeeFormDialog({
    super.key,
    this.initialData,
    required this.onSubmit,
  });

  @override
  State<EmployeeFormDialog> createState() => _EmployeeFormDialogState();
}

class _EmployeeFormDialogState extends State<EmployeeFormDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();

  String _selectedDept = 'IT';
  String _selectedPosition = 'Nhân viên';
  String _selectedRole = 'user';

  final _departments = ['IT', 'HR', 'Kế toán', 'Marketing'];
  final _positions = ['Nhân viên', 'Trưởng phòng', 'Quản lý'];
  final _roles = ['user', 'admin'];

  @override
  void initState() {
    super.initState();
    final data = widget.initialData;
    if (data != null) {
      _nameController.text = data['name'] ?? '';
      _usernameController.text = data['userId']?['username'] ?? '';
      _selectedDept = data['department'] ?? _selectedDept;
      _selectedPosition = data['position'] ?? _selectedPosition;
      _selectedRole = data['userId']?['role'] ?? _selectedRole;
    }
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;

    final data = {
      'name': _nameController.text.trim(),
      'username': _usernameController.text.trim(),
      'password': _passwordController.text.trim(),
      'department': _selectedDept,
      'position': _selectedPosition,
      'role': _selectedRole,
    };

    widget.onSubmit(data);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.initialData == null ? 'Thêm nhân viên' : 'Cập nhật nhân viên'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Tên nhân viên'),
                validator: (v) => v!.isEmpty ? 'Bắt buộc' : null,
              ),
              TextFormField(
                controller: _usernameController,
                decoration: const InputDecoration(labelText: 'Tài khoản'),
                validator: (v) => v!.isEmpty ? 'Bắt buộc' : null,
              ),
              if (widget.initialData == null)
                TextFormField(
                  controller: _passwordController,
                  decoration: const InputDecoration(labelText: 'Mật khẩu'),
                  obscureText: true,
                  validator: (v) => v!.isEmpty ? 'Bắt buộc' : null,
                ),
              DropdownButtonFormField<String>(
                value: _selectedDept,
                items: _departments.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
                onChanged: (v) => setState(() => _selectedDept = v!),
                decoration: const InputDecoration(labelText: 'Phòng ban'),
              ),
              DropdownButtonFormField<String>(
                value: _selectedPosition,
                items: _positions.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
                onChanged: (v) => setState(() => _selectedPosition = v!),
                decoration: const InputDecoration(labelText: 'Chức vụ'),
              ),
              DropdownButtonFormField<String>(
                value: _selectedRole,
                items: _roles.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
                onChanged: (v) => setState(() => _selectedRole = v!),
                decoration: const InputDecoration(labelText: 'Phân quyền'),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Hủy')),
        FilledButton(onPressed: _submit, child: const Text('Lưu')),
      ],
    );
  }
}
