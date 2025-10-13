import '../../../core/network/dio_client.dart';

class ChatApi {
  final _dio = DioClient().dio;

  Future<Map<String, dynamic>> rooms() async {
    final r = await _dio.get('/messages/rooms'); // ❌ bỏ /api
    return Map<String, dynamic>.from(r.data);
  }

  Future<List<dynamic>> history(String roomId) async {
    final r = await _dio.get('/messages/$roomId'); // ❌ bỏ /api
    return (r.data as List);
  }

  Future<Map<String, dynamic>> send(String roomId, String content) async {
    final r = await _dio.post('/messages', data: {
      'roomId': roomId,
      'content': content,
    }); // ❌ bỏ /api
    return Map<String, dynamic>.from(r.data);
  }

  Future<Map<String, dynamic>> privateRoom(String otherUserId) async {
    final r = await _dio.post('/messages/rooms/private', data: {
      'otherUserId': otherUserId,
    }); // ❌ bỏ /api
    return Map<String, dynamic>.from(r.data);
  }
}
