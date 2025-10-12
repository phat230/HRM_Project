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
      final data = await _api.login(username, password);
      final access = data['accessToken'] as String;
      final refresh = data['refreshToken'] as String;
      final user = data['user'] as Map<String, dynamic>;
      await _ref.read(sessionProvider.notifier).saveLogin(
            accessToken: access,
            refreshToken: refresh,
            userId: user['_id'] ?? user['id'],
            username: user['username'],
            role: user['role'],
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
