import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/env.dart';

class DioClient {
  DioClient._();
  static final DioClient instance = DioClient._();

  final Dio dio = Dio(
    BaseOptions(
      baseUrl: Env.apiBase,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
      headers: {
        'Content-Type': 'application/json',
      },
    ),
  )..interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // 🔐 Gắn Bearer token nếu có
          final sp = await SharedPreferences.getInstance();
          final token = sp.getString('access_token');
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }

          // 🪵 Log request
          print('📡 [API REQUEST] ${options.method} ${options.uri}');
          print('🪪 [TOKEN] ${options.headers['Authorization']}');

          handler.next(options);
        },
        onError: (e, handler) async {
          print('❌ [API ERROR] ${e.requestOptions.uri}');
          print('❌ [STATUS] ${e.response?.statusCode}');
          print('❌ [DATA] ${e.response?.data}');

          // 🔄 Refresh token nếu bị 401
          if (e.response?.statusCode == 401) {
            final ok = await _refreshToken();
            if (ok) {
              final sp = await SharedPreferences.getInstance();
              final token = sp.getString('access_token');
              final retry = e.requestOptions;
              retry.headers['Authorization'] = 'Bearer $token';

              // ❗ dùng Dio tạm để tránh self-reference
              final tempDio = Dio(BaseOptions(baseUrl: Env.apiBase));
              final newResponse = await tempDio.fetch(retry);
              return handler.resolve(newResponse);
            }
          }

          handler.next(e);
        },
      ),
    );

  static Future<bool> _refreshToken() async {
    try {
      final sp = await SharedPreferences.getInstance();
      final rt = sp.getString('refresh_token');
      if (rt == null || rt.isEmpty) return false;

      final tempDio = Dio(BaseOptions(baseUrl: Env.apiBase));
      final res = await tempDio.post(
        '/auth/refresh',
        data: {'refreshToken': rt},
      );

      final newAccess = res.data['accessToken'] as String?;
      if (newAccess != null) {
        await sp.setString('access_token', newAccess);
        return true;
      }
      return false;
    } catch (e) {
      print('❌ Refresh token failed: $e');
      return false;
    }
  }
}
