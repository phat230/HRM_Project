import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';

class AuthApi {
  final Dio _dio = DioClient.instance.dio;

  Future<Map<String, dynamic>> login(String username, String password) async {
    final Response res = await _dio.post(
      '/auth/login',
      data: {
        'username': username,
        'password': password,
      },
    );
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> register({
    required String username,
    required String password,
    required String name,
    required String department,
    required String position,
  }) async {
    // 👉 nếu người dùng không nhập thì dùng mặc định "Nhân viên"
    final pos = position.isEmpty ? 'Nhân viên' : position;

    final Response res = await _dio.post(
      '/auth/register',
      data: {
        'username': username,
        'password': password,
        'name': name,
        'department': department,
        'position': pos,
      },
    );

    return Map<String, dynamic>.from(res.data as Map);
  }
}
