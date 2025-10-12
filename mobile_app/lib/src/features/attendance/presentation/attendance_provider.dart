import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/attendance_api.dart';

final attendanceListProvider =
    AutoDisposeAsyncNotifierProvider<AttendanceListNotifier, List<Map<String, dynamic>>>(
        AttendanceListNotifier.new);

class AttendanceListNotifier
    extends AutoDisposeAsyncNotifier<List<Map<String, dynamic>>> {
  final _api = AttendanceApi();

  @override
  Future<List<Map<String, dynamic>>> build() async {
    final raw = await _api.getHistory();
    return raw.map<Map<String, dynamic>>((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = AsyncData(await build());
  }

  Future<String> checkIn() async {
    final r = await _api.checkIn();
    await refresh();
    return r['message'] ?? 'Check-in OK';
  }

  Future<String> checkOut() async {
    final r = await _api.checkOut();
    await refresh();
    return r['message'] ?? 'Check-out OK';
  }

  Future<String> overtimeStart() async {
    final r = await _api.overtimeStart();
    await refresh();
    return r['message'] ?? 'Overtime bắt đầu';
  }

  Future<String> overtimeEnd() async {
    final r = await _api.overtimeEnd();
    await refresh();
    return r['message'] ?? 'Overtime kết thúc';
  }
}
