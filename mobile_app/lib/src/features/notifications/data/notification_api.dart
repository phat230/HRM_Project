import '../../../core/network/dio_client.dart';

class NotificationApi {
  final _dio = DioClient().dio;

  Future<List<dynamic>> list() async {
    final r = await _dio.get('/notifications');
    return (r.data as List);
  }
}
