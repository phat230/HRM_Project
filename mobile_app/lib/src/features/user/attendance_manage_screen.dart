import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_providers.dart'; 
import '../../core/session/session_controller.dart';

class AttendanceManageScreen extends ConsumerStatefulWidget {
  const AttendanceManageScreen({super.key});

  @override
  ConsumerState<AttendanceManageScreen> createState() =>
      _AttendanceManageScreenState();
}

class _AttendanceManageScreenState
    extends ConsumerState<AttendanceManageScreen> {
  bool loading = true;
  List<dynamic> employees = [];
  final Set<String> selected = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => loading = true);

    try {
      final api = ref.read(apiClientProvider).dio;
      final res = await api.get("/manager/group");
      employees = res.data;
    } catch (e) {
      debugPrint("ERR: $e");
    }

    setState(() => loading = false);
  }

  void toggle(String id) {
    setState(() {
      if (selected.contains(id)) {
        selected.remove(id);
      } else {
        selected.add(id);
      }
    });
  }

  Future<void> checkin() async {
    if (selected.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Chưa chọn nhân viên")),
      );
      return;
    }

    try {
      final api = ref.read(apiClientProvider).dio;

      await api.post(
        "/attendance/bulk-checkin",
        data: {"userIds": selected.toList()},
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("✔ Đã chấm công thành công")),
      );

      selected.clear();
      await _load();
    } catch (e) {
      debugPrint("ERR: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Chấm công nhân viên")),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                ...employees.map((emp) {
                  final id = emp["userId"]["_id"];

                  return Card(
                    child: CheckboxListTile(
                      value: selected.contains(id),
                      onChanged: (_) => toggle(id),
                      title: Text(emp["name"] ?? "Không rõ"),
                      subtitle:
                          Text("Tài khoản: ${emp["userId"]["username"]}"),
                    ),
                  );
                }),

                if (selected.isNotEmpty)
                  FilledButton(
                    onPressed: checkin,
                    child: Text("✔ Chấm công ${selected.length} nhân viên"),
                  ),
              ],
            ),
    );
  }
}
