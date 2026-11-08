import 'workbench_pref_store_stub.dart'
    if (dart.library.io) 'workbench_pref_store_io.dart';

/// Async key/value store for workbench UI state (desktop file, mobile prefs).
///
/// Subclass it to inject an in-memory store in tests.
class WorkbenchPrefStore {
  const WorkbenchPrefStore();

  Future<String?> read(String key) => readWorkbenchPrefIo(key);

  Future<void> write(String key, String value) =>
      writeWorkbenchPrefIo(key, value);
}
