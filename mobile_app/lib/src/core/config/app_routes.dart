import 'package:flutter/material.dart';

// ================== AUTH ==================
import '../../features/auth/login_screen.dart';
import '../../features/auth/register_screen.dart';

// ================== USER ==================
import '../../features/user/home_user_screen.dart';

// ================== ADMIN ==================
import '../../features/admin/dashboard/admin_dashboard_screen.dart';
import '../../features/admin/employees/employee_list_screen.dart';
import '../../features/admin/leave/leave_requests_screen.dart';
import '../../features/admin/documents/documents_admin_screen.dart';
import '../../features/admin/notifications/notifications_admin_screen.dart';
import '../../features/admin/performance/performance_admin_screen.dart';
import '../../features/admin/salary/salary_admin_screen.dart';
import '../../features/admin/attendance/attendance_admin_screen.dart';
import '../../features/admin/report/report_admin_screen.dart';

// ✅ Chat
import '../../features/admin/chat/chat_admin_list_screen.dart';
import '../../features/admin/chat/chat_admin_room_screen.dart';

class AppRoutes {
  // ================== AUTH ==================
  static const login = '/login';
  static const register = '/register';

  // ================== USER ==================
  static const userHome = '/user/home';

  // ================== ADMIN ==================
  static const adminDashboard = '/admin/dashboard';
  static const adminEmployees = '/admin/employees';
  static const adminLeave = '/admin/leave';
  static const adminDocuments = '/admin/documents';
  static const adminNotifications = '/admin/notifications';
  static const adminPerformance = '/admin/performance';
  static const adminSalary = '/admin/salary';
  static const adminAttendance = '/admin/attendance';
  static const adminReport = '/admin/report';
  static const adminChat = '/admin/chat';
  static const adminChatRoom = '/admin/chat/room';

  // ================== ROUTE MAP ==================
  static Map<String, WidgetBuilder> routes = {
    login: (context) => const LoginScreen(),
    register: (context) => const RegisterScreen(),

    userHome: (context) => const HomeUserScreen(),

    adminDashboard: (context) => const AdminDashboardScreen(),
    adminEmployees: (context) => const EmployeeListScreen(),
    adminLeave: (context) => const LeaveRequestsScreen(),
    adminDocuments: (context) => const DocumentsAdminScreen(),
    adminNotifications: (context) => const NotificationsAdminScreen(),
    adminPerformance: (context) => const PerformanceAdminScreen(),
    adminSalary: (context) => const SalaryAdminScreen(),
    adminAttendance: (context) => const AttendanceAdminScreen(),
    adminReport: (context) => const ReportAdminScreen(),

    adminChat: (context) => const ChatAdminListScreen(),
    adminChatRoom: (context) => const ChatAdminRoomScreen(
      roomId: '',
      isGroup: false,
    ),
  };
}
