import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../widgets/admin_drawer.dart';
import '../../../core/utils/admin_guard.dart';

class PerformanceAdminScreen extends StatefulWidget {
  const PerformanceAdminScreen({super.key});

  @override
  State<PerformanceAdminScreen> createState() => _PerformanceAdminScreenState();
}

class _PerformanceAdminScreenState extends State<PerformanceAdminScreen> {
  bool loading = false;
  List reviews = [];
  List employees = [];

  // ✅ Khai báo rõ kiểu → tránh lỗi Object
  final Map<String, dynamic> form = {
    'userId': '',
    'tasksCompleted': 0,
    'communication': 0,
    'technical': 0,
    'attitude': 10,
    'feedback': '',
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await ApiClient.instance.dio.get('/admin/performance');
      final emp = await ApiClient.instance.dio.get('/admin/employees');
      setState(() {
        reviews = res.data is List ? res.data : [];
        employees = emp.data is List ? emp.data : [];
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Lỗi tải dữ liệu')),
      );
    } finally {
      setState(() => loading = false);
    }
  }

  Future<void> _save() async {
    if (form['userId'] == '') return;
    try {
      await ApiClient.instance.dio.post('/admin/performance', data: form);
      _load();
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Lỗi lưu đánh giá')),
      );
    }
  }

  void _openForm([Map? review]) {
    final isEdit = review != null;
    if (isEdit) {
      form['userId'] = review['userId']?['_id'] ?? '';
      form['tasksCompleted'] = review['tasksCompleted'] ?? 0;
      form['communication'] = review['communication'] ?? 0;
      form['technical'] = review['technical'] ?? 0;
      form['attitude'] = review['attitude'] ?? 10;
      form['feedback'] = review['feedback'] ?? '';
    } else {
      form['userId'] = '';
      form['tasksCompleted'] = 0;
      form['communication'] = 0;
      form['technical'] = 0;
      form['attitude'] = 10;
      form['feedback'] = '';
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom + 16,
          left: 16,
          right: 16,
          top: 16,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                isEdit ? '✏️ Cập nhật đánh giá' : '➕ Thêm đánh giá mới',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField(
                decoration: const InputDecoration(labelText: 'Nhân viên'),
                value: (form['userId'] as String).isEmpty ? null : form['userId'] as String,
                items: employees.map<DropdownMenuItem<String>>((e) {
                  return DropdownMenuItem<String>(
                    value: e['userId']?['_id'],
                    child: Text('${e['name']} (${e['userId']?['username']})'),
                  );
                }).toList(),
                onChanged: (v) => setState(() => form['userId'] = v ?? ''),
              ),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Số nhiệm vụ hoàn thành'),
                keyboardType: TextInputType.number,
                initialValue: form['tasksCompleted'].toString(),
                onChanged: (v) => form['tasksCompleted'] = int.tryParse(v) ?? 0,
              ),
              _slider('Kỹ năng giao tiếp', 'communication'),
              _slider('Kỹ năng kỹ thuật', 'technical'),
              _slider('Thái độ / tinh thần', 'attitude', max: 10, min: 0, step: 10),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Nhận xét'),
                initialValue: form['feedback'] as String,
                onChanged: (v) => form['feedback'] = v,
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _save,
                icon: const Icon(Icons.save),
                label: const Text('Lưu đánh giá'),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _slider(String label, String key, {double min = 0, double max = 10, double step = 2}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('$label: ${form[key]}'),
        Slider(
          min: min,
          max: max,
          divisions: ((max - min) / step).round(),
          value: (form[key] as num).toDouble(),
          onChanged: (v) => setState(() => form[key] = v.round()),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return AdminGuard(
      child: Scaffold(
        appBar: AppBar(
          title: const Text('📊 Đánh giá hiệu suất'),
          actions: [
            IconButton(onPressed: () => _openForm(), icon: const Icon(Icons.add)),
          ],
        ),
        drawer: const AdminDrawer(),
        body: loading
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: _load,
                child: reviews.isEmpty
                    ? const Center(child: Text('Chưa có đánh giá'))
                    : ListView.builder(
                        itemCount: reviews.length,
                        itemBuilder: (context, index) {
                          final r = reviews[index];
                          final username = r['userId']?['username'] ?? '';
                          return Card(
                            margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            child: ListTile(
                              title: Text(username),
                              subtitle: Text(
                                'Task: ${r['tasksCompleted']} | Giao tiếp: ${r['communication']} | '
                                'Kỹ thuật: ${r['technical']} | Thái độ: ${r['attitude']}\n'
                                'Nhận xét: ${r['feedback'] ?? ''}',
                              ),
                              trailing: IconButton(
                                icon: const Icon(Icons.edit),
                                onPressed: () => _openForm(r),
                              ),
                            ),
                          );
                        },
                      ),
              ),
      ),
    );
  }
}
