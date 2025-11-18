import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../widgets/admin_drawer.dart';
import '../../../core/utils/admin_guard.dart';

class AttendanceAdminScreen extends StatefulWidget {
  const AttendanceAdminScreen({super.key});

  @override
  State<AttendanceAdminScreen> createState() => _AttendanceAdminScreenState();
}

class _AttendanceAdminScreenState extends State<AttendanceAdminScreen> {
  bool loading = false;
  List<Map<String, dynamic>> records = [];
  String? selectedDate; // yyyy-MM-dd hoặc null
  final Set<String> checked = {}; // userId đã chọn

  String get _todayStr => DateTime.now().toIso8601String().split('T').first;

  @override
  void initState() {
    super.initState();
    _load();
  }

  // ==== LOAD DỮ LIỆU GIỐNG WEB ====
  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await ApiClient.instance.dio.get(
        '/attendance',
        queryParameters:
            (selectedDate != null && selectedDate!.isNotEmpty)
                ? {'date': selectedDate}
                : null,
      );
      final data = (res.data as List).cast<Map<String, dynamic>>();
      setState(() {
        records = data;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('❌ Lỗi tải dữ liệu chấm công')),
        );
      }
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  void _toggleChecked(String? uid) {
    if (uid == null || uid.isEmpty) return;
    setState(() {
      if (checked.contains(uid)) {
        checked.remove(uid);
      } else {
        checked.add(uid);
      }
    });
  }

  // ==== FORMAT GIỜ 24H GIỐNG WEB (HH:mm) ====
  String _fmtTime(dynamic iso) {
    if (iso == null) return '–';
    final dt = DateTime.tryParse(iso.toString());
    if (dt == null) return '–';
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final initial = (selectedDate != null && selectedDate!.isNotEmpty)
        ? DateTime.tryParse(selectedDate!) ?? now
        : now;

    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 1),
    );

    if (picked != null) {
      setState(() {
        selectedDate = picked.toIso8601String().split('T').first;
      });
      await _load();
    }
  }

  Future<bool> _confirm(String message) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Huỷ'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Đồng ý'),
          ),
        ],
      ),
    );
    return ok == true;
  }

  // ==== CHẤM CÔNG HÀNG LOẠT GIỐNG WEB ====
  Future<void> _bulkCheckIn() async {
    if (checked.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Chưa chọn nhân viên')),
      );
      return;
    }

    final today = _todayStr;

    if (selectedDate != null && selectedDate!.isNotEmpty && selectedDate != today) {
      final cont = await _confirm(
          'Chấm công sẽ tính cho NGÀY HÔM NAY. Tiếp tục?');
      if (!cont) return;
    }

    final ok = await _confirm(
        'Xác nhận chấm công cho ${checked.length} nhân viên?');
    if (!ok) return;

    try {
      final res = await ApiClient.instance.dio.post(
        '/attendance/bulk-checkin',
        data: {'userIds': checked.toList()},
      );
      final msg = res.data['message']?.toString() ?? '✔ Đã chấm công';
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg)),
        );
      }
      setState(() {
        checked.clear();
        selectedDate = today;
      });
      await _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('❌ Không thể chấm công')),
        );
      }
    }
  }

  Future<void> _removeRecord(String id) async {
    final ok = await _confirm('Xoá bản ghi này?');
    if (!ok) return;

    try {
      await ApiClient.instance.dio.delete('/attendance/manual/$id');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('🗑 Đã xoá bản ghi')),
        );
      }
      await _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('❌ Không thể xoá bản ghi')),
        );
      }
    }
  }

  // ==== GIỐNG BACKEND: TÍNH TRỄ TỪ GIỜ VÀO (>= 7:00) ====
  int _calcLateFromDate(DateTime? dt) {
    if (dt == null) return 0;
    final mins = dt.hour * 60 + dt.minute;
    final start = 7 * 60;
    final diff = mins - start;
    return diff > 0 ? diff : 0;
  }

  // ==== TÍNH GIỜ VÀO TỪ PHÚT TRỄ (BASE 07:00) ====
  DateTime? _calcCheckInFromLate(String? dateStr, int lateMinutes) {
    if (dateStr == null || dateStr.isEmpty) return null;
    final d = DateTime.tryParse(dateStr);
    if (d == null) return null;

    // giống web: bắt đầu từ 07:00 rồi cộng thêm phút trễ
    return DateTime(d.year, d.month, d.day, 7, 0)
        .add(Duration(minutes: lateMinutes));
  }

  // ==== TÍNH OT KHI GIỜ RA > 17:00 ====
  double _calcOT(DateTime? dt) {
    if (dt == null) return 0;
    final mins = dt.hour * 60 + dt.minute;
    final diff = mins - 17 * 60;
    if (diff <= 0) return 0;
    return diff / 60.0;
  }

  // ==== DIALOG SỬA GIỐNG WEB ====
  Future<void> _openEdit(Map<String, dynamic> rec) async {
    final dateStr = rec['date']?.toString();
    DateTime? checkIn =
        rec['checkIn'] != null ? DateTime.tryParse(rec['checkIn'].toString()) : null;
    DateTime? checkOut =
        rec['checkOut'] != null ? DateTime.tryParse(rec['checkOut'].toString()) : null;
    int lateMinutes =
        int.tryParse(rec['lateMinutes']?.toString() ?? '') ?? 0;
    double overtimeHours =
        double.tryParse(rec['overtimeHours']?.toString() ?? '') ?? 0;
    int totalDays = int.tryParse(rec['totalDays']?.toString() ?? '') ?? 1;

    if (totalDays < 0) totalDays = 0;
    if (totalDays > 1) totalDays = 1;

    Future<void> save() async {
      final body = <String, dynamic>{
        'lateMinutes': lateMinutes,
        'totalDays': totalDays,
      };

      if (checkIn != null) {
        body['checkIn'] = checkIn!.toIso8601String();
      }
      if (checkOut != null) {
        body['checkOut'] = checkOut!.toIso8601String();
      }

      try {
        await ApiClient.instance.dio.put(
          '/attendance/manual/${rec['_id']}',
          data: body,
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('✔ Đã cập nhật')),
          );
        }
        await _load();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('❌ Không thể lưu thay đổi')),
          );
        }
      }
    }

    await showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setStateDialog) {
            Future<void> pickTimeIn() async {
              if (dateStr == null) return;
              final baseDate = DateTime.tryParse(dateStr) ?? DateTime.now();
              final initialTime = TimeOfDay.fromDateTime(
                  checkIn ??
                      DateTime(baseDate.year, baseDate.month, baseDate.day, 7, 0));
              final picked = await showTimePicker(
                context: ctx,
                initialTime: initialTime,
              );
              if (picked != null) {
                final d = DateTime(
                    baseDate.year, baseDate.month, baseDate.day, picked.hour, picked.minute);
                setStateDialog(() {
                  checkIn = d;
                  lateMinutes = _calcLateFromDate(checkIn);
                  overtimeHours = _calcOT(checkOut);
                });
              }
            }

            Future<void> pickTimeOut() async {
              if (dateStr == null) return;
              final baseDate = DateTime.tryParse(dateStr) ?? DateTime.now();
              final initialTime = TimeOfDay.fromDateTime(
                  checkOut ??
                      DateTime(baseDate.year, baseDate.month, baseDate.day, 17, 0));
              final picked = await showTimePicker(
                context: ctx,
                initialTime: initialTime,
              );
              if (picked != null) {
                final d = DateTime(
                    baseDate.year, baseDate.month, baseDate.day, picked.hour, picked.minute);
                setStateDialog(() {
                  checkOut = d;
                  overtimeHours = _calcOT(checkOut);
                });
              }
            }

            return AlertDialog(
              title: const Text('✏️ Sửa chấm công'),
              content: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('Giờ vào'),
                    const SizedBox(height: 4),
                    InkWell(
                      onTap: pickTimeIn,
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          contentPadding:
                              EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        ),
                        child: Text(
                          checkIn == null
                              ? '—'
                              : _fmtTime(checkIn!.toIso8601String()),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text('Giờ ra'),
                    const SizedBox(height: 4),
                    InkWell(
                      onTap: pickTimeOut,
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          contentPadding:
                              EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        ),
                        child: Text(
                          checkOut == null
                              ? '—'
                              : _fmtTime(checkOut!.toIso8601String()),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text('Đi trễ (phút)'),
                    const SizedBox(height: 4),
                    TextField(
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                      ),
                      controller: TextEditingController(
                        text: lateMinutes.toString(),
                      ),
                      onChanged: (v) {
                        final lm = int.tryParse(v) ?? 0;
                        setStateDialog(() {
                          lateMinutes = lm;
                          // === CHỈNH GIỜ VÀO THEO PHÚT TRỄ (07:00 + lm) GIỐNG WEB ===
                          if (dateStr != null) {
                            checkIn = _calcCheckInFromLate(dateStr, lateMinutes);
                          }
                          overtimeHours = _calcOT(checkOut);
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                    const Text('OT (giờ)'),
                    const SizedBox(height: 4),
                    InputDecorator(
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        contentPadding:
                            EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      child: Text(overtimeHours.toStringAsFixed(2)),
                    ),
                    const SizedBox(height: 12),
                    const Text('Công'),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<int>(
                      value: totalDays,
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                      ),
                      items: const [
                        DropdownMenuItem(
                          value: 0,
                          child: Text('0 — Không công'),
                        ),
                        DropdownMenuItem(
                          value: 1,
                          child: Text('1 — Đủ công'),
                        ),
                      ],
                      onChanged: (v) {
                        if (v == null) return;
                        setStateDialog(() {
                          totalDays = v;
                        });
                      },
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: const Text('Huỷ'),
                ),
                FilledButton(
                  onPressed: () async {
                    await save();
                    if (context.mounted) {
                      Navigator.of(ctx).pop();
                    }
                  },
                  child: const Text('Lưu thay đổi'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildTable() {
    if (records.isEmpty) {
      return const Center(child: Text('Không có dữ liệu'));
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        headingRowColor: MaterialStateProperty.all(
          Theme.of(context).colorScheme.surfaceVariant,
        ),
        columns: const [
          DataColumn(label: Text('')),
          DataColumn(label: Text('Nhân viên')),
          DataColumn(label: Text('Ngày')),
          DataColumn(label: Text('Giờ vào')),
          DataColumn(label: Text('Ra')),
          DataColumn(label: Text('Trễ (phút)')),
          DataColumn(label: Text('OT (giờ)')),
          DataColumn(label: Text('Công')),
          DataColumn(label: Text('')),
        ],
        rows: records.map((r) {
          final uid = r['userId']?['_id']?.toString() ?? '';
          final name = r['userId']?['username']?.toString() ?? '';
          final date = r['date']?.toString() ?? '';
          final late = r['lateMinutes'] ?? 0;
          final ot = r['overtimeHours'] ?? 0;
          final days = r['totalDays'] ?? 0;

          return DataRow(
            cells: [
              DataCell(
                Checkbox(
                  value: checked.contains(uid),
                  onChanged: (_) => _toggleChecked(uid),
                ),
              ),
              DataCell(Text(name)),
              DataCell(Text(date)),
              DataCell(Text(_fmtTime(r['checkIn']))),
              DataCell(Text(_fmtTime(r['checkOut']))),
              DataCell(Text('$late')),
              DataCell(Text('$ot')),
              DataCell(Text('$days')),
              DataCell(
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.edit),
                      tooltip: 'Sửa',
                      onPressed: () => _openEdit(r),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete),
                      color: Colors.red,
                      tooltip: 'Xoá',
                      onPressed: () {
                        final id = r['_id']?.toString() ?? '';
                        if (id.isNotEmpty) {
                          _removeRecord(id);
                        }
                      },
                    ),
                  ],
                ),
              ),
            ],
          );
        }).toList(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AdminGuard(
      child: Scaffold(
        appBar: AppBar(
          title: const Text('🕒 Quản lý chấm công'),
        ),
        drawer: const AdminDrawer(),
        body: Column(
          children: [
            // === HÀNG FILTER NGÀY ===
            Padding(
              padding: const EdgeInsets.all(8),
              child: Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: _pickDate,
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Ngày',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.calendar_today),
                        ),
                        child: Text(
                          selectedDate ?? 'Tất cả',
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton(
                    onPressed: () {
                      setState(() {
                        selectedDate = _todayStr;
                      });
                      _load();
                    },
                    child: const Text('Hôm nay'),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton(
                    onPressed: () {
                      setState(() {
                        selectedDate = null;
                      });
                      _load();
                    },
                    child: const Text('Xem tất cả'),
                  ),
                ],
              ),
            ),

            // === HÀNG NÚT CHẤM CÔNG / BỎ CHỌN ===
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Row(
                children: [
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: checked.isEmpty ? null : _bulkCheckIn,
                      icon: const Icon(Icons.check_circle_outline),
                      label: Text('Chấm công ngay (${checked.length})'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton(
                    onPressed: checked.isEmpty
                        ? null
                        : () {
                            setState(() {
                              checked.clear();
                            });
                          },
                    child: const Text('Bỏ chọn'),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 8),

            // === BẢNG DỮ LIỆU ===
            Expanded(
              child: loading
                  ? const Center(child: CircularProgressIndicator())
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        padding: const EdgeInsets.all(8),
                        children: [
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(8),
                              child: _buildTable(),
                            ),
                          ),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
