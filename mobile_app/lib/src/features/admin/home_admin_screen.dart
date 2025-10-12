// lib/src/features/admin/home_admin_screen.dart
import 'package:flutter/material.dart';

class HomeAdminScreen extends StatelessWidget {
  const HomeAdminScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('HRM — Admin')),
      body: const Center(
        child: Text('Trang Admin (placeholder). Bạn có thể bổ sung các tab quản trị sau.'),
      ),
    );
  }
}
