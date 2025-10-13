import 'package:dio/dio.dart';
import '../config/env.dart';
import '../session/session_controller.dart';

class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  late final Dio dio = Dio(
    BaseOptions(
      baseUrl: Env.apiBase, // 👈 chỉ cần base, ví dụ: http://10.0.2.2:5000
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
      headers: {
        'Content-Type': 'application/json',
      },
    ),
  )..interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          // 🔐 Gắn token Bearer
          final token = SessionStore.instance.token;
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }

          // 🪵 In log để dễ debug
          print('📡 [API REQUEST] ${options.method} ${options.uri}');
          print('🪪 [TOKEN] ${options.headers['Authorization']}');
          handler.next(options);
        },
        onError: (e, handler) {
          // 🪵 Log lỗi
          print('❌ [API ERROR] ${e.requestOptions.uri}');
          print('❌ [STATUS] ${e.response?.statusCode}');
          print('❌ [DATA] ${e.response?.data}');
          handler.next(e);
        },
      ),
    );
}
