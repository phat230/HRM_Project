import 'package:flutter/material.dart';
import '../../../core/config/app_routes.dart';
import '../../../widgets/admin_drawer.dart';
import '../../../core/utils/admin_guard.dart';

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  Widget _card(BuildContext context, IconData icon, String label, Color color, String route) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: () => Navigator.pushNamed(context, route),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 40, color: color),
              const SizedBox(height: 10),
              Text(label, style: const TextStyle(fontSize: 16)),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AdminGuard(
      child: Scaffold(
        appBar: AppBar(title: const Text('📊 Dashboard Admin')),
        drawer: const AdminDrawer(),
        body: GridView.count(
          crossAxisCount: 2,
          padding: const EdgeInsets.all(16),
          children: [
            _card(context, Icons.people, 'Nhân viên', Colors.indigo, AppRoutes.adminEmployees),
            _card(context, Icons.assignment, 'Chấm công', Colors.blue, AppRoutes.adminAttendance),
            _card(context, Icons.folder, 'Tài liệu', Colors.orange, AppRoutes.adminDocuments),
            _card(context, Icons.calendar_month, 'Nghỉ phép', Colors.teal, AppRoutes.adminLeave),
            _card(context, Icons.attach_money, 'Lương', Colors.green, AppRoutes.adminSalary),
            _card(context, Icons.message, 'Chat', Colors.purple, AppRoutes.adminChat),
            _card(context, Icons.campaign, 'Thông báo', Colors.red, AppRoutes.adminNotifications),
            _card(context, Icons.star, 'Hiệu suất', Colors.amber, AppRoutes.adminPerformance),
            _card(context, Icons.analytics, 'Báo cáo', Colors.brown, AppRoutes.adminReport),
          ],
        ),
      ),
    );
  }
}
