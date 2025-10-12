import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/leave_api.dart';

final leaveListProvider =
    AutoDisposeAsyncNotifierProvider<LeaveListNotifier, List<Map<String, dynamic>>>(
        LeaveListNotifier.new);

class LeaveListNotifier
    extends AutoDisposeAsyncNotifier<List<Map<String, dynamic>>> {
  final _api = LeaveApi();

  @override
  Future<List<Map<String, dynamic>>> build() async {
    final raw = await _api.myLeaves();
    return raw.map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = AsyncData(await build());
  }

  Future<String> createLeave(DateTime from, DateTime to, String reason) async {
    final r = await _api.create(from: from, to: to, reason: reason);
    await refresh();
    return r['message'] ?? 'Đã gửi đơn nghỉ';
  }
}
