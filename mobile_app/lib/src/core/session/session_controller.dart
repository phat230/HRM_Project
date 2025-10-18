import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

// 👇 Thêm import để ngắt kết nối socket khi logout
import '../../features/user/chat/chat_service.dart';

/// Trạng thái phiên đăng nhập
enum SessionStatus { unknown, loggedOut, loggedIn }

/// Model lưu thông tin phiên hiện tại
class SessionState {
  final SessionStatus status;
  final String? role;
  final String? username;
  final String? userId; // ✅ Thêm userId để dùng cho các chức năng nhân viên

  const SessionState({
    required this.status,
    this.role,
    this.username,
    this.userId,
  });

  SessionState copyWith({
    SessionStatus? status,
    String? role,
    String? username,
    String? userId,
  }) {
    return SessionState(
      status: status ?? this.status,
      role: role ?? this.role,
      username: username ?? this.username,
      userId: userId ?? this.userId,
    );
  }

  Map<String, dynamic> toJson() => {
        'status': status.name,
        'role': role,
        'username': username,
        'userId': userId,
      };

  static SessionState fromJson(Map<String, dynamic> m) {
    final s = switch (m['status'] as String? ?? 'loggedOut') {
      'unknown' => SessionStatus.unknown,
      'loggedIn' => SessionStatus.loggedIn,
      _ => SessionStatus.loggedOut,
    };
    return SessionState(
      status: s,
      role: m['role'] as String?,
      username: m['username'] as String?,
      userId: m['userId'] as String?,
    );
  }
}

/// Store quản lý lưu trữ token & thông tin session trong local (SharedPreferences)
class SessionStore {
  SessionStore._();
  static final SessionStore instance = SessionStore._();

  String? token;

  /// Lưu token + role + username vào SharedPreferences
  Future<void> save(String token, String role, String username, String userId) async {
    this.token = token;
    final sp = await SharedPreferences.getInstance();
    await sp.setString('auth_token', token);
    await sp.setString(
      'session_info',
      jsonEncode({
        'status': 'loggedIn',
        'role': role,
        'username': username,
        'userId': userId,
      }),
    );
  }

  /// Load token và thông tin session từ SharedPreferences
  Future<(String?, SessionState)> load() async {
    final sp = await SharedPreferences.getInstance();
    token = sp.getString('auth_token');
    final raw = sp.getString('session_info');
    if (raw == null) {
      return (token, const SessionState(status: SessionStatus.loggedOut));
    }
    return (token, SessionState.fromJson(jsonDecode(raw)));
  }

  /// Xóa token & session info
  Future<void> clear() async {
    token = null;
    final sp = await SharedPreferences.getInstance();
    await sp.remove('auth_token');
    await sp.remove('session_info');
  }
}

/// Controller quản lý trạng thái phiên đăng nhập (Riverpod)
class SessionController extends StateNotifier<SessionState> {
  SessionController() : super(const SessionState(status: SessionStatus.unknown)) {
    _bootstrap();
  }

  /// Khởi động lại session khi app mở
  Future<void> _bootstrap() async {
    final (_, s) = await SessionStore.instance.load();
    state = s;
  }

  /// Đăng nhập hoặc đăng ký thành công → lưu token, role, username, userId
  Future<void> setLoggedIn({
    required String token,
    required String role,
    required String username,
    required String userId, // ✅ thêm userId
  }) async {
    await SessionStore.instance.save(token, role, username, userId);
    state = SessionState(
      status: SessionStatus.loggedIn,
      role: role,
      username: username,
      userId: userId,
    );
  }

  /// Đăng xuất → xóa sạch session + ngắt socket
  Future<void> logout() async {
    // 1. Xóa token và session_info
    await SessionStore.instance.clear();

    // 2. Xóa toàn bộ SharedPreferences để loại bỏ user_id, username, role cũ
    final sp = await SharedPreferences.getInstance();
    await sp.clear();

    // 3. Ngắt kết nối socket chat (nếu có)
    ChatService.instance.dispose();

    // 4. Đặt lại trạng thái
    state = const SessionState(status: SessionStatus.loggedOut);
  }
}

/// Provider Riverpod để truy cập session trong toàn app
final sessionProvider = StateNotifierProvider<SessionController, SessionState>(
  (ref) => SessionController(),
);
