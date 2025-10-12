import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../core/api/api_client.dart';

class LeaveRequestScreen extends StatefulWidget {
  const LeaveRequestScreen({super.key});
  @override
  State<LeaveRequestScreen> createState() => _LeaveRequestScreenState();
}

class _LeaveRequestScreenState extends State<LeaveRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  DateTime? _from;
  DateTime? _to;
  final _reason = TextEditingController();
  bool saving = false;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_from == null || _to == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Chọn đủ Từ ngày / Đến ngày')));
      return;
    }
    setState(() => saving = true);
    try {
      await ApiClient.instance.dio.post('/leave-requests', data: {
        'from': _from!.toIso8601String().split('T').first,
        'to': _to!.toIso8601String().split('T').first,
        'reason': _reason.text.trim(),
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✅ Đã gửi đơn nghỉ')));
      setState(() { _from = null; _to = null; _reason.clear(); });
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?.toString() ?? '❌ Gửi đơn thất bại';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  Future<void> _pickDate(bool isFrom) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      firstDate: DateTime(now.year, now.month - 3, 1),
      lastDate: DateTime(now.year, now.month + 6, 0),
      initialDate: now,
    );
    if (picked != null) setState(() => isFrom ? _from = picked : _to = picked);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('📌 Xin nghỉ phép')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(children: [
              Expanded(child: _DateTile(label: 'Từ ngày', value: _from, onTap: () => _pickDate(true))),
              const SizedBox(width: 8),
              Expanded(child: _DateTile(label: 'Đến ngày', value: _to, onTap: () => _pickDate(false))),
            ]),
            const SizedBox(height: 12),
            TextFormField(
              controller: _reason,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Lý do', border: OutlineInputBorder()),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Nhập lý do' : null,
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: saving ? null : _submit,
              icon: const Icon(Icons.send),
              label: Text(saving ? 'Đang gửi...' : 'Gửi đơn'),
            ),
          ],
        ),
      ),
    );
  }
}

class _DateTile extends StatelessWidget {
  const _DateTile({required this.label, required this.value, required this.onTap});
  final String label; final DateTime? value; final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      tileColor: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.3),
      title: Text(label),
      subtitle: Text(value == null ? 'Chọn ngày' : value!.toIso8601String().split('T').first),
      trailing: const Icon(Icons.date_range),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    );
  }
}
