import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../widgets/admin_drawer.dart';
import '../../../core/utils/admin_guard.dart';

class DocumentsAdminScreen extends StatefulWidget {
  const DocumentsAdminScreen({super.key});

  @override
  State<DocumentsAdminScreen> createState() => _DocumentsAdminScreenState();
}

class _DocumentsAdminScreenState extends State<DocumentsAdminScreen> {
  List<Map<String, dynamic>> docs = [];
  bool loading = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    final res = await ApiClient.instance.dio.get('/admin/documents');
    setState(() {
      docs = List<Map<String, dynamic>>.from(res.data);
      loading = false;
    });
  }

  Future<void> _uploadFile() async {
    final result = await FilePicker.platform.pickFiles();
    if (result == null) return;
    final file = result.files.single;

    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(file.path!, filename: file.name),
    });

    await ApiClient.instance.dio.post('/admin/documents', data: formData);
    ScaffoldMessenger.of(context)
        .showSnackBar(const SnackBar(content: Text('✅ Upload thành công')));
    _load();
  }

  Future<void> _downloadFile(String id, String name) async {
    final savePath = '/storage/emulated/0/Download/$name';
    await ApiClient.instance.dio.download('/admin/documents/download/$id', savePath);
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text('📥 Đã tải: $name')));
  }

  Future<void> _deleteFile(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Xóa tài liệu'),
        content: const Text('Bạn có chắc chắn muốn xóa tài liệu này không?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Hủy')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Xóa')),
        ],
      ),
    );

    if (confirm == true) {
      await ApiClient.instance.dio.delete('/admin/documents/$id');
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('🗑 Xóa thành công')));
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return AdminGuard(
      child: Scaffold(
        appBar: AppBar(
          title: const Text('📂 Quản lý tài liệu'),
          actions: [
            IconButton(
              onPressed: _uploadFile,
              icon: const Icon(Icons.upload_file),
            ),
          ],
        ),
        drawer: const AdminDrawer(),
        body: loading
            ? const Center(child: CircularProgressIndicator())
            : docs.isEmpty
                ? const Center(child: Text('Chưa có tài liệu'))
                : ListView.builder(
                    itemCount: docs.length,
                    itemBuilder: (context, index) {
                      final d = docs[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        child: ListTile(
                          title: Text(d['title'] ?? 'Tài liệu'),
                          subtitle: Text('Phòng ban: ${d['department'] ?? 'Chung'}'),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.download),
                                onPressed: () => _downloadFile(d['_id'], d['title'] ?? 'file'),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete, color: Colors.red),
                                onPressed: () => _deleteFile(d['_id']),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
