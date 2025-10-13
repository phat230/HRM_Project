import 'package:flutter/material.dart';
import '../core/config/app_routes.dart';
import '../core/session/session_controller.dart';

class AdminDrawer extends StatelessWidget {
  const AdminDrawer({super.key});

  void _go(BuildContext context, String route) {
    Navigator.pushReplacementNamed(context, route);
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          const DrawerHeader(
            decoration: BoxDecoration(color: Colors.indigo),
            child: Text(
              '👑 Admin Menu',
              style: TextStyle(color: Colors.white, fontSize: 18),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.dashboard),
            title: const Text('Tổng quan'),
            onTap: () => _go(context, AppRoutes.adminDashboard),
          ),
          ListTile(
            leading: const Icon(Icons.people),
            title: const Text('Quản lý nhân viên'),
            onTap: () => _go(context, AppRoutes.adminEmployees),
          ),
          ListTile(
            leading: const Icon(Icons.beach_access),
            title: const Text('Nghỉ phép'),
            onTap: () => _go(context, AppRoutes.adminLeave),
          ),
          ListTile(
            leading: const Icon(Icons.assignment),
            title: const Text('Chấm công'),
            onTap: () => _go(context, AppRoutes.adminAttendance),
          ),
          ListTile(
            leading: const Icon(Icons.chat),
            title: const Text('Chat'),
            onTap: () => _go(context, AppRoutes.adminChat),
          ),
          ListTile(
            leading: const Icon(Icons.bar_chart),
            title: const Text('Báo cáo'),
            onTap: () => _go(context, AppRoutes.adminReport),
          ),
          ListTile(
            leading: const Icon(Icons.notifications),
            title: const Text('Thông báo'),
            onTap: () => _go(context, AppRoutes.adminNotifications),
          ),
          ListTile(
            leading: const Icon(Icons.analytics),
            title: const Text('Hiệu suất'),
            onTap: () => _go(context, AppRoutes.adminPerformance),
          ),
          ListTile(
            leading: const Icon(Icons.folder),
            title: const Text('Tài liệu'),
            onTap: () => _go(context, AppRoutes.adminDocuments),
          ),
          ListTile(
            leading: const Icon(Icons.monetization_on),
            title: const Text('Lương'),
            onTap: () => _go(context, AppRoutes.adminSalary),
          ),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Đăng xuất'),
            onTap: () async {
              await SessionStore.instance.clear();
              if (context.mounted) {
                Navigator.pushReplacementNamed(context, AppRoutes.login);
              }
            },
          ),
        ],
      ),
    );
  }
}
