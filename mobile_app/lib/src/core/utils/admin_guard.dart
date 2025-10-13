import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../session/session_controller.dart';
import '../config/app_routes.dart';

/// ✅ Chặn người không phải admin truy cập trang quản trị
class AdminGuard extends ConsumerWidget {
  final Widget child;

  const AdminGuard({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);

    // Nếu chưa đăng nhập hoặc không phải admin thì điều hướng về Login
    if (session.status != SessionStatus.loggedIn || session.role != 'admin') {
      Future.microtask(() {
        if (context.mounted) {
          Navigator.pushReplacementNamed(context, AppRoutes.login);
        }
      });

      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return child;
  }
}
