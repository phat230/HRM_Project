import '../../../core/network/dio_client.dart';

class ProfileApi {
  final _dio = DioClient().dio;

  Future<Map<String, dynamic>> me() async {
    final r = await _dio.get('/employees/me');
    return Map<String, dynamic>.from(r.data);
  }

  Future<Map<String, dynamic>> updateName(String name) async {
    final r = await _dio.put('/employees/profile', data: {'name': name});
    return Map<String, dynamic>.from(r.data);
  }

  Future<String> changePassword(String oldPass, String newPass) async {
    final r = await _dio.put('/employees/change-password', data: {
      'oldPassword': oldPass,
      'newPassword': newPass,
    });
    return r.data['message'] ?? 'Đổi mật khẩu thành công';
  }
}
