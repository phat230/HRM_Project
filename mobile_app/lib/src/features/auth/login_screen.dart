// lib/src/features/auth/login_screen.dart
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/session/session_controller.dart';

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
      final res = await ApiClient.instance.dio.post('/auth/login', data: {
        'username': _user.text.trim(),
        'password': _pass.text,
      });
      final data = res.data as Map<String, dynamic>;
      final token = data['token']?.toString() ?? '';
      final role = data['role']?.toString() ?? 'employee';
      final username = data['username']?.toString() ?? _user.text.trim();

      await ref.read(sessionProvider.notifier).setLoggedIn(
            token: token,
            role: role,
            username: username,
          );
    } on DioException catch (e) {
      final msg = e.response?.data is Map
          ? (e.response!.data['error']?.toString() ?? 'Đăng nhập thất bại')
          : 'Đăng nhập thất bại';
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('❌ $msg')));
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
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Nhập username' : null,
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
          ],
        ),
      ),
    );
  }
}
