import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../../core/config/env.dart';

class ChatService {
  ChatService._();
  static final ChatService instance = ChatService._();

  IO.Socket? _socket;

  IO.Socket socket() {
    if (_socket != null) return _socket!;
    _socket = IO.io(
      Env.socketBase,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .enableReconnection()
          .setReconnectionDelay(1000)
          .build(),
    );
    return _socket!;
  }

  void join({String? userId, String? department}) {
    final s = socket();
    s.emit('join', {'userId': userId, 'department': department});
  }

  void sendMessage(Map<String, dynamic> payload) {
    socket().emit('send_message', payload);
  }

  void onMessage(void Function(dynamic data) handler) {
    socket().on('receive_message', handler);
  }

  void dispose() {
    _socket?.dispose();
    _socket = null;
  }
}
