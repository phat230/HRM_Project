import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/session/session_controller.dart';
import '../data/auth_api.dart';

class LoginController extends StateNotifier<AsyncValue<void>> {
  LoginController(this._ref) : super(const AsyncData(null));
  final Ref _ref;
  final _api = AuthApi();

  Future<void> login(String username, String password) async {
    state = const AsyncLoading();
    try {
      // Gọi API login
      final data = await _api.login(username, password);
      final token = data['token'] as String; // khớp backend
      final user = data['user'] as Map<String, dynamic>;

      final role = user['role']?.toString() ?? 'employee';
      final usernameResp = user['username']?.toString() ?? username;
      final userId = user['_id']?.toString() ?? ''; // ✅ thêm dòng này

      // Lưu session
      await _ref.read(sessionProvider.notifier).setLoggedIn(
            token: token,
            role: role,
            username: usernameResp,
            userId: userId, // 👈 thêm userId bắt buộc
          );

      state = const AsyncData(null);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }
}

final loginControllerProvider =
    StateNotifierProvider<LoginController, AsyncValue<void>>(
        (ref) => LoginController(ref));
