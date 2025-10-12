import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'attendance_provider.dart';

class AttendanceScreen extends ConsumerWidget {
  const AttendanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(attendanceListProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chấm công'),
        actions: [
          IconButton(
            onPressed: () => ref.read(attendanceListProvider.notifier).refresh(),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: state.when(
        data: (list) => ListView.separated(
          padding: const EdgeInsets.all(16),
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemCount: list.length,
          itemBuilder: (context, i) {
            final r = list[i];
            return Card(
              child: ListTile(
                title: Text(r['userId']?['username'] ?? ''),
                subtitle: Text('Ngày: ${r['date'] ?? '-'}\n'
                    'Vào: ${r['checkIn'] ?? '-'} '
                    'Trễ: ${r['lateMinutes'] ?? 0}p  '
                    'OT: ${r['overtimeHours'] ?? 0}h'),
              ),
            );
          },
        ),
        error: (e, _) => Center(child: Text('Lỗi: $e')),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () async {
                    final msg = await ref.read(attendanceListProvider.notifier).checkIn();
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
                    }
                  },
                  icon: const Icon(Icons.fingerprint),
                  label: const Text('Check-in'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () async {
                    final msg = await ref.read(attendanceListProvider.notifier).checkOut();
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
                    }
                  },
                  icon: const Icon(Icons.logout),
                  label: const Text('Check-out'),
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: _OtButtons(),
    );
  }
}

class _OtButtons extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        FloatingActionButton.extended(
          heroTag: 'ot1',
          onPressed: () async {
            final msg = await ref.read(attendanceListProvider.notifier).overtimeStart();
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
            }
          },
          icon: const Icon(Icons.timer),
          label: const Text('OT bắt đầu'),
        ),
        const SizedBox(height: 8),
        FloatingActionButton.extended(
          heroTag: 'ot2',
          onPressed: () async {
            final msg = await ref.read(attendanceListProvider.notifier).overtimeEnd();
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
            }
          },
          icon: const Icon(Icons.timer_off),
          label: const Text('OT kết thúc'),
        ),
      ],
    );
  }
}
