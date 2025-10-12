import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';

class AuthApi {
  final _dio = DioClient().dio;

  Future<Map<String, dynamic>> login(String username, String password) async {
    final res = await _dio.post('/auth/login', data: {
      'username': username,
      'password': password,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> payload) async {
    final res = await _dio.post('/auth/register', data: payload);
    return Map<String, dynamic>.from(res.data as Map);
  }
}
