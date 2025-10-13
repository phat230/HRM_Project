import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class AuthController {
  static final AuthController instance = AuthController._internal();
  factory AuthController() => instance;
  AuthController._internal();

  final storage = const FlutterSecureStorage();
  String? token;
  String? role;

  final String baseUrl = "http://10.0.2.2:5000/api"; // ⚠ đổi IP nếu chạy thật

  Future<bool> login(String username, String password) async {
    final url = Uri.parse("$baseUrl/auth/login");
    final res = await http.post(
      url,
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"username": username, "password": password}),
    );

    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      token = data['token'];
      role = data['user']['role'];
      await storage.write(key: 'token', value: token);
      await storage.write(key: 'role', value: role);
      return true;
    } else {
      return false;
    }
  }

  Future<void> logout() async {
    token = null;
    role = null;
    await storage.deleteAll();
  }

  Future<void> restore() async {
    token = await storage.read(key: 'token');
    role = await storage.read(key: 'role');
  }

  Map<String, String> get headers => {
    "Content-Type": "application/json",
    if (token != null) "Authorization": "Bearer $token"
  };
}
