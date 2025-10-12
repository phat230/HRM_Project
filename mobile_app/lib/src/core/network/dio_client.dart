import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class DioClient {
  DioClient._();
  static final DioClient _i = DioClient._();
  factory DioClient() => _i;

  final Dio dio = Dio(BaseOptions(
    baseUrl: AppConfig.api,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 20),
    headers: {'Content-Type': 'application/json'},
  ))
    ..interceptors.add(InterceptorsWrapper(
      onRequest: (opts, handler) async {
        // Đính kèm Bearer token
        final sp = await SharedPreferences.getInstance();
        final token = sp.getString('access_token');
        if (token != null && token.isNotEmpty) {
          opts.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(opts);
      },
      onError: (e, handler) async {
        // Auto refresh nếu 401 và có refresh_token
        if (e.response?.statusCode == 401) {
          final ok = await _refreshToken();
          if (ok) {
            final req = e.requestOptions;
            final cl = Dio(BaseOptions(baseUrl: AppConfig.api));
            final sp = await SharedPreferences.getInstance();
            final token = sp.getString('access_token');
            req.headers['Authorization'] = 'Bearer $token';
            final res = await cl.fetch(req);
            return handler.resolve(res);
          }
        }
        handler.next(e);
      },
    ));

  static Future<bool> _refreshToken() async {
    try {
      final sp = await SharedPreferences.getInstance();
      final rt = sp.getString('refresh_token');
      if (rt == null) return false;

      final dio = Dio(BaseOptions(baseUrl: AppConfig.api));
      final res = await dio.post('/auth/refresh', data: {'refreshToken': rt});
      final access = res.data['accessToken'] as String?;
      if (access != null) {
        await sp.setString('access_token', access);
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }
}
