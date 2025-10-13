import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'src/core/config/app_routes.dart';
import 'src/core/session/session_controller.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SessionStore.instance.load();
  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'HRM Mobile',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.indigo),
      initialRoute: AppRoutes.login,
      routes: AppRoutes.routes,
    );
  }
}
