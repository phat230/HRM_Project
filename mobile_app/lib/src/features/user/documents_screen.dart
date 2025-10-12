// lib/src/features/user/documents_screen.dart
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import '../../core/api/api_client.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key});
  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  bool loading = true;
  String? error;
  List<dynamic> docs = [];

  Future<void> _load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      // GET /api/employees/documents (đúng với backend đã làm)
      final res = await ApiClient.instance.dio.get('/employees/documents');
      docs = (res.data is List) ? res.data : [];
    } on DioException catch (e) {
      error = e.response?.data?['error']?.toString() ?? 'Lỗi tải tài liệu';
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _upload() async {
    try {
      final result = await FilePicker.platform.pickFiles(withReadStream: true);
      if (result == null || result.files.isEmpty) return;

      final f = result.files.single;
      final fileName = f.name;
      final stream = f.readStream; // Stream<List<int>>?
      if (stream == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Không đọc được file')),
          );
        }
        return;
      }

      final form = FormData.fromMap({
        'folder': 'Chung',
        // ✅ DIO 5.9.0: dùng THAM SỐ VỊ TRÍ thứ 2 là length (KHÔNG dùng length:)
        'file': MultipartFile.fromStream(
          () => stream, // stream provider
          f.size,       // length (positional)
          filename: fileName,
        ),
      });

      // POST /api/employees/documents
      await ApiClient.instance.dio.post('/employees/documents', data: form);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('✅ Upload thành công: $fileName')),
      );
      await _load();
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?.toString() ?? 'Upload thất bại';
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ $msg')),
        );
      }
    }
  }

  Future<void> _download(String id, String title) async {
    try {
      // Lưu vào thư mục Documents riêng của app
      final dir = await getApplicationDocumentsDirectory();
      final savePath = '${dir.path}/$title';

      final resp = await ApiClient.instance.dio.get(
        '/employees/documents/download/$id',
        options: Options(responseType: ResponseType.bytes),
      );

      final file = File(savePath);
      final bytes = resp.data as List<int>; // Uint8List/List<int> đều ok
      await file.writeAsBytes(bytes);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('⬇️ Đã lưu: $savePath')),
        );
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?.toString() ?? 'Tải file thất bại';
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ $msg')),
        );
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('📄 Tài liệu'),
        actions: [
          IconButton(
            onPressed: _upload,
            icon: const Icon(Icons.upload_file),
            tooltip: 'Upload',
          )
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (loading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
              ),
            if (!loading && error != null)
              Card(
                color: Colors.red.withOpacity(0.08),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    error!,
                    style: const TextStyle(color: Colors.red),
                  ),
                ),
              ),
            if (!loading && error == null)
              ...docs.map((d) {
                final m = d as Map<String, dynamic>;
                final id = m['_id']?.toString() ?? '';
                final title = m['title']?.toString() ?? '(Không tên)';
                final type = m['fileType']?.toString() ?? '-';
                final dep = m['department']?.toString() ?? '-';
                final time =
                    (m['uploadedAt']?.toString() ?? '').split('T').first;
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.insert_drive_file),
                    title: Text(title),
                    subtitle: Text('Loại: $type · Phòng: $dep · Ngày: $time'),
                    trailing: IconButton(
                      icon: const Icon(Icons.download),
                      onPressed:
                          id.isEmpty ? null : () => _download(id, title),
                      tooltip: 'Tải về',
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
