import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/config/app_config.dart';

typedef MessageHandler = void Function(Map<String, dynamic> payload);

class SocketService {
  IO.Socket? _socket;

  void connect({MessageHandler? onMessage}) async {
    final sp = await SharedPreferences.getInstance();
    final userId = sp.getString('user_id');
    // Kết nối
    _socket = IO.io(
      AppConfig.baseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .build(),
    )..connect();

    _socket?.onConnect((_) {
      if (userId != null) {
        _socket?.emit('join', {'userId': userId});
      }
    });

    _socket?.on('receive_message', (data) {
      if (data is Map<String, dynamic>) {
        onMessage?.call(data);
      } else if (data is Map) {
        onMessage?.call(Map<String, dynamic>.from(data));
      }
    });
  }

  void send(Map<String, dynamic> payload) {
    _socket?.emit('send_message', payload);
  }

  void dispose() {
    _socket?.dispose();
  }
}
