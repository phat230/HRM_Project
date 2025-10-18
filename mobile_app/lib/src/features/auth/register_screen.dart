import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'presentation/register_controller.dart';
import '../../core/config/app_routes.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _username = TextEditingController();
  final _password = TextEditingController();
  final _name = TextEditingController();
  // 👇 mặc định là Nhân viên
  final _position = TextEditingController(text: 'Nhân viên');
  String _department = '';

  Future<void> _doRegister() async {
    if (!_formKey.currentState!.validate()) return;

    final controller = ref.read(registerControllerProvider.notifier);
    await controller.register(
      username: _username.text.trim(),
      password: _password.text,
      name: _name.text,
      department: _department,
      position: _position.text, // 👈 mặc định "Nhân viên" nếu không đổi
    );

    final state = ref.read(registerControllerProvider);
    if (state is AsyncError) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('❌ Đăng ký thất bại: ${state.error}')),
      );
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✅ Đăng ký thành công')),
        );
        Navigator.pushReplacementNamed(context, AppRoutes.userHome);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final loading = ref.watch(registerControllerProvider).isLoading;

    return Scaffold(
      appBar: AppBar(title: const Text('Đăng ký tài khoản')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _username,
              decoration: const InputDecoration(labelText: 'Tên đăng nhập'),
              validator: (v) => (v == null || v.isEmpty) ? 'Nhập username' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _password,
              decoration: const InputDecoration(labelText: 'Mật khẩu'),
              obscureText: true,
              validator: (v) => (v == null || v.isEmpty) ? 'Nhập mật khẩu' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'Họ và tên'),
              validator: (v) => (v == null || v.isEmpty) ? 'Nhập tên' : null,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _department.isEmpty ? null : _department,
              decoration: const InputDecoration(labelText: 'Phòng ban'),
              items: const [
                DropdownMenuItem(value: 'IT', child: Text('IT')),
                DropdownMenuItem(value: 'HR', child: Text('Nhân sự')),
                DropdownMenuItem(value: 'Kế toán', child: Text('Kế toán')),
                DropdownMenuItem(value: 'Kinh doanh', child: Text('Kinh doanh')),
              ],
              onChanged: (v) => setState(() => _department = v ?? ''),
              validator: (v) =>
                  (v == null || v.isEmpty) ? 'Chọn phòng ban' : null,
            ),
            const SizedBox(height: 12),
            // 👉 Nếu bạn muốn người dùng không chỉnh chức vụ, ẩn TextField này
            TextFormField(
              controller: _position,
              enabled: false, // ❌ không cho sửa
              decoration: const InputDecoration(labelText: 'Chức vụ (mặc định: Nhân viên)'),
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: loading ? null : _doRegister,
              icon: const Icon(Icons.person_add),
              label: Text(loading ? 'Đang đăng ký...' : 'Đăng ký'),
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('⬅ Quay lại đăng nhập'),
            ),
          ],
        ),
      ),
    );
  }
}
