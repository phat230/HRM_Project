import 'dart:convert';
import 'package:http/http.dart' as http;
import '../session/auth_controller.dart';

class ApiClient {
  static final _auth = AuthController.instance;
  static const String baseUrl = "http://10.0.2.2:5000/api"; // đổi khi deploy

  static Future<dynamic> get(String path) async {
    final res = await http.get(Uri.parse('$baseUrl$path'), headers: _auth.headers);
    return jsonDecode(res.body);
  }

  static Future<dynamic> post(String path, Map data) async {
    final res = await http.post(Uri.parse('$baseUrl$path'), headers: _auth.headers, body: jsonEncode(data));
    return jsonDecode(res.body);
  }

  static Future<dynamic> put(String path, Map data) async {
    final res = await http.put(Uri.parse('$baseUrl$path'), headers: _auth.headers, body: jsonEncode(data));
    return jsonDecode(res.body);
  }

  static Future<dynamic> delete(String path) async {
    final res = await http.delete(Uri.parse('$baseUrl$path'), headers: _auth.headers);
    return jsonDecode(res.body);
  }
}
