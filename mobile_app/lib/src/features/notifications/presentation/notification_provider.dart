import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/notification_api.dart';

final notificationProvider =
    AutoDisposeAsyncNotifierProvider<NotificationNotifier, List<Map<String, dynamic>>>(
        NotificationNotifier.new);

class NotificationNotifier
    extends AutoDisposeAsyncNotifier<List<Map<String, dynamic>>> {
  final _api = NotificationApi();

  @override
  Future<List<Map<String, dynamic>>> build() async {
    final raw = await _api.list();
    return raw.map((e) => Map<String, dynamic>.from(e)).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = AsyncData(await build());
  }
}
