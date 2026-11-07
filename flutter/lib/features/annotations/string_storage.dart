/// Key-value storage (Electron `localStorage`-shaped).
abstract class StringStorage {
  String? read(String key);
  void write(String key, String value);
  void remove(String key);
}

/// In-memory store for tests and hosts without platform persistence yet.
class InMemoryStringStorage implements StringStorage {
  InMemoryStringStorage([Map<String, String>? seed]) : _map = {...?seed};

  final Map<String, String> _map;

  @override
  String? read(String key) => _map[key];

  @override
  void write(String key, String value) => _map[key] = value;

  @override
  void remove(String key) => _map.remove(key);
}
