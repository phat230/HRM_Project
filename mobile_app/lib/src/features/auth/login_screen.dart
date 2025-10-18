import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// 👇 Controller (nếu bạn muốn dùng Riverpod login)
import 'presentation/login_controller.dart';

// 👇 Core
import '../../core/api/api_client.dart';
import '../../core/session/session_controller.dart';
import '../../core/config/app_routes.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _user = TextEditingController();
  final _pass = TextEditingController();
  bool _loading = false;

  Future<void> _doLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);

    try {
      final res = await ApiClient.instance.dio.post(
        '/auth/login',
        data: {
          'username': _user.text.trim(),
          'password': _pass.text,
        },
      );

      final data = res.data as Map<String, dynamic>;
      final token = data['token']?.toString() ?? '';
      final role = data['user']?['role']?.toString() ?? 'employee';
      final username =
          data['user']?['username']?.toString() ?? _user.text.trim();
      final userId = data['user']?['_id']?.toString() ?? ''; // 👈 thêm userId

      // ✅ Ghi session đầy đủ
      await ref.read(sessionProvider.notifier).setLoggedIn(
            token: token,
            role: role,
            username: username,
            userId: userId,
          );

      if (!mounted) return;

      if (role == 'admin') {
        Navigator.pushReplacementNamed(context, AppRoutes.adminDashboard);
      } else {
        Navigator.pushReplacementNamed(context, AppRoutes.userHome);
      }
    } on DioException catch (e) {
      final msg = e.response?.data is Map
          ? (e.response!.data['error']?.toString() ?? 'Đăng nhập thất bại')
          : 'Đăng nhập thất bại';
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('❌ $msg')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Đăng nhập HRM')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _user,
              decoration: const InputDecoration(labelText: 'Username'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Nhập username' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _pass,
              decoration: const InputDecoration(labelText: 'Password'),
              obscureText: true,
              validator: (v) => (v == null || v.isEmpty) ? 'Nhập password' : null,
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _loading ? null : _doLogin,
              icon: const Icon(Icons.login),
              label: Text(_loading ? 'Đang đăng nhập...' : 'Đăng nhập'),
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: () => Navigator.pushNamed(context, AppRoutes.register),
              child: const Text('Chưa có tài khoản? Đăng ký ngay'),
            ),
          ],
        ),
      ),
    );
  }
}
