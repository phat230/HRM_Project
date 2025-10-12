// lib/src/app.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/session/session_controller.dart';
import 'features/auth/login_screen.dart';
import 'features/admin/home_admin_screen.dart';
import 'features/user/home_user_screen.dart';

class HRMMobileApp extends ConsumerWidget {
  const HRMMobileApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);

    Widget home;
    if (session.status == SessionStatus.unknown) {
      home = const _SplashScreen();
    } else if (session.status == SessionStatus.loggedOut) {
      home = const LoginScreen();
    } else {
      home = (session.role == 'admin')
          ? const HomeAdminScreen()
          : const HomeUserScreen();
    }

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'HRM Mobile',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      home: home,
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}
