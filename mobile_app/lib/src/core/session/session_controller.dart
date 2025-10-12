// lib/src/core/session/session_controller.dart
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum SessionStatus { unknown, loggedOut, loggedIn }

class SessionState {
  final SessionStatus status;
  final String? role;
  final String? username;
  const SessionState({
    required this.status,
    this.role,
    this.username,
  });

  SessionState copyWith({SessionStatus? status, String? role, String? username}) {
    return SessionState(
      status: status ?? this.status,
      role: role ?? this.role,
      username: username ?? this.username,
    );
  }

  Map<String, dynamic> toJson() => {
        'status': status.name,
        'role': role,
        'username': username,
      };

  static SessionState fromJson(Map<String, dynamic> m) {
    final s = switch (m['status'] as String? ?? 'loggedOut') {
      'unknown' => SessionStatus.unknown,
      'loggedIn' => SessionStatus.loggedIn,
      _ => SessionStatus.loggedOut,
    };
    return SessionState(status: s, role: m['role'] as String?, username: m['username'] as String?);
  }
}

class SessionStore {
  SessionStore._();
  static final SessionStore instance = SessionStore._();

  String? token;

  Future<void> save(String token, String role, String username) async {
    this.token = token;
    final sp = await SharedPreferences.getInstance();
    await sp.setString('auth_token', token);
    await sp.setString('session_info', jsonEncode({'status': 'loggedIn', 'role': role, 'username': username}));
  }

  Future<(String?, SessionState)> load() async {
    final sp = await SharedPreferences.getInstance();
    token = sp.getString('auth_token');
    final raw = sp.getString('session_info');
    if (raw == null) return (token, const SessionState(status: SessionStatus.loggedOut));
    return (token, SessionState.fromJson(jsonDecode(raw)));
  }

  Future<void> clear() async {
    token = null;
    final sp = await SharedPreferences.getInstance();
    await sp.remove('auth_token');
    await sp.remove('session_info');
  }
}

class SessionController extends StateNotifier<SessionState> {
  SessionController() : super(const SessionState(status: SessionStatus.unknown)) {
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final (_, s) = await SessionStore.instance.load();
    state = s;
  }

  Future<void> setLoggedIn({required String token, required String role, required String username}) async {
    await SessionStore.instance.save(token, role, username);
    state = SessionState(status: SessionStatus.loggedIn, role: role, username: username);
  }

  Future<void> logout() async {
    await SessionStore.instance.clear();
    state = const SessionState(status: SessionStatus.loggedOut);
  }
}

final sessionProvider = StateNotifierProvider<SessionController, SessionState>(
  (ref) => SessionController(),
);
