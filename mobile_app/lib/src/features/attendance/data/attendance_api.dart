import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';

class AttendanceApi {
  final _dio = DioClient().dio;

  Future<List<dynamic>> getHistory() async {
    final res = await _dio.get('/attendance');
    return (res.data as List);
  }

  Future<Map<String, dynamic>> checkIn() async {
    final res = await _dio.post('/attendance/check-in');
    return Map<String, dynamic>.from(res.data);
  }

  Future<Map<String, dynamic>> checkOut() async {
    final res = await _dio.post('/attendance/check-out');
    return Map<String, dynamic>.from(res.data);
  }

  Future<Map<String, dynamic>> overtimeStart() async {
    final res = await _dio.post('/attendance/overtime');
    return Map<String, dynamic>.from(res.data);
  }

  Future<Map<String, dynamic>> overtimeEnd() async {
    final res = await _dio.post('/attendance/overtime/checkout');
    return Map<String, dynamic>.from(res.data);
  }
}
