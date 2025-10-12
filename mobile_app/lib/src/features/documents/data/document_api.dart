import 'package:dio/dio.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/config/app_config.dart';
import '../../../core/network/dio_client.dart';

class DocumentApi {
  final _dio = DioClient().dio;

  Future<List<dynamic>> listMy() async {
    final r = await _dio.get('/employees/documents');
    return (r.data as List);
  }

  Future<void> download(String id, String filename) async {
    // Dùng link trực tiếp để mở trình duyệt (giữ session bằng token trong header không tiện)
    final url = Uri.parse('${AppConfig.api}/employees/documents/download/$id');
    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
      throw 'Không mở được URL tải file';
    }
  }

  Future<Map<String, dynamic>> upload(String filePath, {String folder = 'Chung'}) async {
    final form = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath),
      'folder': folder,
    });
    final r = await _dio.post('/employees/documents', data: form);
    return Map<String, dynamic>.from(r.data);
  }
}
