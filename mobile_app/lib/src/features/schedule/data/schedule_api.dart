import '../../../core/network/dio_client.dart';

class ScheduleApi {
  final _dio = DioClient().dio;

  Future<List<dynamic>> mySchedule() async {
    final r = await _dio.get('/work-schedule');
    return (r.data as List);
  }

  Future<Map<String, dynamic>> updateStatus(String id, String status) async {
    final r = await _dio.put('/user/work-schedule/$id/status', data: {'status': status});
    return Map<String, dynamic>.from(r.data);
  }
}
