import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../core/api/api_client.dart';

class ProfileUpdateScreen extends StatefulWidget {
  const ProfileUpdateScreen({super.key});
  @override
  State<ProfileUpdateScreen> createState() => _ProfileUpdateScreenState();
}

class _ProfileUpdateScreenState extends State<ProfileUpdateScreen> {
  bool loading = true;
  Map<String, dynamic>? profile;
  final _nameCtrl = TextEditingController();
  final _oldPass = TextEditingController();
  final _newPass = TextEditingController();

  Future<void> _load() async {
    setState(() { loading = true; });
    try {
      final res = await ApiClient.instance.dio.get('/employees/me');
      profile = res.data as Map<String, dynamic>;
      _nameCtrl.text = profile?['name']?.toString() ?? '';
    } finally {
      if (mounted) setState(() { loading = false; });
    }
  }

  Future<void> _saveName() async {
    try {
      await ApiClient.instance.dio.put('/employees/profile', data: {'name': _nameCtrl.text.trim()});
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✅ Cập nhật tên thành công')));
      await _load();
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?.toString() ?? '❌ Lỗi cập nhật';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    }
  }

  Future<void> _changePassword() async {
    if (_oldPass.text.trim().isEmpty || _newPass.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Nhập đủ mật khẩu cũ/mới')));
      return;
    }
    try {
      await ApiClient.instance.dio.put('/employees/change-password', data: { // ← PUT thay vì POST
        'oldPassword': _oldPass.text.trim(),
        'newPassword': _newPass.text.trim(),
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('🔐 Đổi mật khẩu thành công')));
      _oldPass.clear(); _newPass.clear();
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?.toString() ?? '❌ Lỗi đổi mật khẩu';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    }
  }

  @override
  void initState() { super.initState(); _load(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('👤 Cập nhật hồ sơ')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (loading) const Center(child: Padding(
            padding: EdgeInsets.all(24), child: CircularProgressIndicator(),
          )),
          if (!loading && profile != null) ...[
            TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Tên hiển thị')),
            const SizedBox(height: 8),
            FilledButton.icon(onPressed: _saveName, icon: const Icon(Icons.save), label: const Text('Lưu tên hiển thị')),
            const Divider(height: 32),
            TextField(controller: _oldPass, decoration: const InputDecoration(labelText: 'Mật khẩu cũ'), obscureText: true),
            const SizedBox(height: 8),
            TextField(controller: _newPass, decoration: const InputDecoration(labelText: 'Mật khẩu mới'), obscureText: true),
            const SizedBox(height: 8),
            FilledButton.icon(onPressed: _changePassword, icon: const Icon(Icons.lock_reset), label: const Text('Đổi mật khẩu')),
          ],
        ],
      ),
    );
  }
}
