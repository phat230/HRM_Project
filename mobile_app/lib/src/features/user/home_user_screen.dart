// lib/src/features/user/home_user_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/session/session_controller.dart';

// Screens
import 'user_dashboard_screen.dart';
import 'attendance_screen.dart';
import 'work_schedule_screen.dart';
import 'leave_request_screen.dart';
import 'leave_history_screen.dart';
import 'salary_screen.dart';
import 'profile_update_screen.dart';
import 'notifications_screen.dart';
import 'documents_screen.dart';
import 'performance_review_screen.dart';
import 'chat/chat_list_screen.dart'; 

class HomeUserScreen extends ConsumerStatefulWidget {
  const HomeUserScreen({super.key});
  @override
  ConsumerState<HomeUserScreen> createState() => _HomeUserScreenState();
}

class _HomeUserScreenState extends ConsumerState<HomeUserScreen> {
  int _tab = 0;

  Widget _buildDashboardTab(BuildContext context) {
    final shortcuts = <_MenuItem>[
      _MenuItem('Chấm công', Icons.fingerprint, const AttendanceScreen()),
      _MenuItem('Lịch làm', Icons.calendar_month, const WorkScheduleScreen()),
      _MenuItem('Xin nghỉ', Icons.event_busy, const LeaveRequestScreen()),
      _MenuItem('Lịch sử nghỉ', Icons.history, const LeaveHistoryScreen()),
      _MenuItem('Lương', Icons.payments, const SalaryScreen()),
      _MenuItem('Hồ sơ', Icons.person, const ProfileUpdateScreen()),
      _MenuItem('Thông báo', Icons.notifications, const NotificationsScreen()),
      _MenuItem('Tài liệu', Icons.insert_drive_file, const DocumentsScreen()),
      _MenuItem('Đánh giá', Icons.star_half, const PerformanceReviewScreen()),
      _MenuItem('Chat', Icons.chat, const ChatListScreen()), // ⬅️
    ];
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const UserDashboardScreen(),
        const SizedBox(height: 12),
        Text('Lối tắt', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: shortcuts.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2, mainAxisSpacing: 8, crossAxisSpacing: 8, childAspectRatio: 1.6,
          ),
          itemBuilder: (_, i) {
            final it = shortcuts[i];
            return Card(
              child: InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => it.page)),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(children: [Icon(it.icon), const SizedBox(width: 10), Expanded(child: Text(it.title, maxLines: 2))]),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildWorkTab(BuildContext context) {
    final items = <_MenuItem>[
      _MenuItem('Chấm công', Icons.fingerprint, const AttendanceScreen()),
      _MenuItem('Lịch làm việc', Icons.calendar_month, const WorkScheduleScreen()),
      _MenuItem('Xin nghỉ phép', Icons.event_busy, const LeaveRequestScreen()),
      _MenuItem('Lịch sử nghỉ', Icons.history, const LeaveHistoryScreen()),
    ];
    return _MenuList(items: items);
  }

  Widget _buildPersonalTab(BuildContext context) {
    final items = <_MenuItem>[
      _MenuItem('Lương cá nhân', Icons.payments, const SalaryScreen()),
      _MenuItem('Hồ sơ cá nhân', Icons.person, const ProfileUpdateScreen()),
      _MenuItem('Thông báo', Icons.notifications, const NotificationsScreen()),
      _MenuItem('Tài liệu', Icons.insert_drive_file, const DocumentsScreen()),
      _MenuItem('Đánh giá hiệu suất', Icons.star_half, const PerformanceReviewScreen()),
      _MenuItem('Chat', Icons.chat, const ChatListScreen()), // ⬅️
    ];
    return _MenuList(items: items);
  }

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      _buildDashboardTab(context),
      _buildWorkTab(context),
      _buildPersonalTab(context),
    ];
    return Scaffold(
      appBar: AppBar(
        title: const Text('HRM — Nhân viên'),
        actions: [
          IconButton(onPressed: () => ref.read(sessionProvider.notifier).logout(), icon: const Icon(Icons.logout), tooltip: 'Đăng xuất'),
        ],
      ),
      body: pages[_tab],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home), label: 'Tổng quan'),
          NavigationDestination(icon: Icon(Icons.work), label: 'Công việc'),
          NavigationDestination(icon: Icon(Icons.settings), label: 'Cá nhân'),
        ],
      ),
    );
  }
}

class _MenuItem {
  final String title;
  final IconData icon;
  final Widget page;
  _MenuItem(this.title, this.icon, this.page);
}

class _MenuList extends StatelessWidget {
  const _MenuList({required this.items});
  final List<_MenuItem> items;
  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemBuilder: (_, i) {
        final it = items[i];
        return Card(
          child: ListTile(
            leading: Icon(it.icon),
            title: Text(it.title),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => it.page)),
          ),
        );
      },
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemCount: items.length,
    );
  }
}
