import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/schedule_api.dart';

final scheduleProvider =
    AutoDisposeAsyncNotifierProvider<ScheduleNotifier, List<Map<String, dynamic>>>(
        ScheduleNotifier.new);

class ScheduleNotifier
    extends AutoDisposeAsyncNotifier<List<Map<String, dynamic>>> {
  final _api = ScheduleApi();

  @override
  Future<List<Map<String, dynamic>>> build() async {
    final raw = await _api.mySchedule();
    return raw.map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = AsyncData(await build());
  }

  Future<String> setStatus(String id, String status) async {
    final r = await _api.updateStatus(id, status);
    await refresh();
    return r['message'] ?? 'Cập nhật trạng thái thành công';
  }
}
