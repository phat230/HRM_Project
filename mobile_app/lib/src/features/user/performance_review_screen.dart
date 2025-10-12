import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../core/api/api_client.dart';

class PerformanceReviewScreen extends StatefulWidget {
  const PerformanceReviewScreen({super.key});
  @override
  State<PerformanceReviewScreen> createState() => _PerformanceReviewScreenState();
}

class _PerformanceReviewScreenState extends State<PerformanceReviewScreen> {
  bool loading = true;
  String? error;
  List<dynamic> reviews = [];

  Future<void> _load() async {
    setState(() { loading = true; error = null; });
    try {
      final res = await ApiClient.instance.dio.get('/employees/performance'); // ← KHỚP backend
      reviews = (res.data is List) ? res.data : [];
    } on DioException catch (e) {
      error = e.response?.data?['error']?.toString() ?? 'Lỗi tải đánh giá';
    } finally {
      if (mounted) setState(() { loading = false; });
    }
  }

  @override
  void initState() { super.initState(); _load(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('📈 Đánh giá hiệu suất')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (loading) const Center(child: Padding(
              padding: EdgeInsets.all(24), child: CircularProgressIndicator(),
            )),
            if (!loading && error != null)
              Card(color: Colors.red.withOpacity(0.08), child: Padding(
                padding: const EdgeInsets.all(16), child: Text(error!, style: const TextStyle(color: Colors.red)),
              )),
            if (!loading && error == null)
              ...reviews.map((r) {
                final m = r as Map<String, dynamic>;
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.star_half),
                    title: Text('Điểm kỹ thuật: ${m['technical'] ?? '-'} • Giao tiếp: ${m['communication'] ?? '-'}'),
                    subtitle: Text(m['feedback']?.toString() ?? ''),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
