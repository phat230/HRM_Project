import 'package:flutter/material.dart';
import '../../core/api/api_client.dart';
import '../../core/session/session_controller.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_providers.dart'; 
class ManageGroupScreen extends ConsumerStatefulWidget {
  const ManageGroupScreen({super.key});

  @override
  ConsumerState<ManageGroupScreen> createState() =>
      _ManageGroupScreenState();
}

class _ManageGroupScreenState extends ConsumerState<ManageGroupScreen> {
  bool loading = true;
  List<dynamic> departmentUsers = [];
  List<dynamic> groupUsers = [];
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

      final dept = await api.get("/manager/department-employees");
      final group = await api.get("/manager/group");

      departmentUsers = dept.data;
      groupUsers = group.data;
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

  Future<void> addToGroup() async {
    if (selected.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Chưa chọn nhân viên nào")),
      );
      return;
    }

    try {
      final api = ref.read(apiClientProvider).dio;

      await api.post(
        "/manager/group/add",
        data: {"employeeIds": selected.toList()},
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("✔ Đã thêm vào nhóm")),
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
      appBar: AppBar(title: const Text("Nhóm nhân viên")),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text("👥 Nhân viên cùng phòng ban",
                    style: TextStyle(
                        fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),

                ...departmentUsers.map((u) {
                  final id = u["_id"];
                  return Card(
                    child: CheckboxListTile(
                      value: selected.contains(id),
                      onChanged: (_) => toggle(id),
                      title: Text(u["name"] ?? "Không rõ"),
                      subtitle:
                          Text("Tài khoản: ${u["userId"]["username"]}"),
                    ),
                  );
                }),

                if (selected.isNotEmpty)
                  FilledButton(
                    onPressed: addToGroup,
                    child: Text("Thêm ${selected.length} vào nhóm"),
                  ),

                const SizedBox(height: 20),
                const Divider(),
                const SizedBox(height: 20),

                const Text("🧑‍💼 Nhân viên bạn quản lý",
                    style: TextStyle(
                        fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),

                ...groupUsers.map((u) {
                  return Card(
                    child: ListTile(
                      title: Text(u["name"] ?? "Không rõ"),
                      subtitle:
                          Text("Tài khoản: ${u["userId"]["username"]}"),
                    ),
                  );
                }),
              ],
            ),
    );
  }
}
