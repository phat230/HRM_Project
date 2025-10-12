import 'package:dio/dio.dart';
import '../api/api_client.dart';

class AuthService {
  final _dio = ApiClient.instance.dio;

  Future<({Map<String, dynamic> profile, String token})> login({
    required String email,
    required String password,
  }) async {
    final res = await _dio.post('/auth/login', data: {'email': email, 'password': password});
    if (res.statusCode == 200 || res.statusCode == 201) {
      final data = res.data as Map<String, dynamic>;
      return (profile: data['user'] as Map<String, dynamic>, token: data['token'] as String);
    }
    throw DioException(requestOptions: res.requestOptions, response: res, error: 'Login failed');
  }
}
