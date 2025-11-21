import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart';

/// Provider chung cho API client
final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient.instance;
});
