import 'package:flutter_riverpod/flutter_riverpod.dart';

// 👇 lùi 3 cấp để đến core/session
import '../../../core/session/session_controller.dart';

// 👇 lùi 1 cấp để đến auth/data
import '../data/auth_api.dart';

class RegisterController extends StateNotifier<AsyncValue<void>> {
  RegisterController(this._ref) : super(const AsyncData(null));
  final Ref _ref;
  final _api = AuthApi();

  Future<void> register({
    required String username,
    required String password,
    required String name,
    required String department,
    required String position,
  }) async {
    state = const AsyncLoading();
    try {
      // 📡 Gửi request đăng ký
      final data = await _api.register(
        username: username,
        password: password,
        name: name,
        department: department,
        position: position,
      );

      // 🪙 Lấy thông tin từ response
      final token = data['token'] as String;
      final user = data['user'] as Map<String, dynamic>;
      final role = user['role'] as String? ?? 'employee';
      final usernameResp = user['username'] as String? ?? username;
      final userId = user['_id']?.toString() ?? ''; // ✅ Lấy userId từ backend

      // 💾 Lưu session + token + userId
      await _ref.read(sessionProvider.notifier).setLoggedIn(
            token: token,
            role: role,
            username: usernameResp,
            userId: userId,
          );

      // ✅ Thành công
      state = const AsyncData(null);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }
}

final registerControllerProvider =
    StateNotifierProvider<RegisterController, AsyncValue<void>>(
        (ref) => RegisterController(ref));
