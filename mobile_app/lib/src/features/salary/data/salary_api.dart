import '../../../core/network/dio_client.dart';

class SalaryApi {
  final _dio = DioClient().dio;

  Future<Map<String, dynamic>> mySalary() async {
    final r = await _dio.get('/salary/me');
    return Map<String, dynamic>.from(r.data);
  }
}
