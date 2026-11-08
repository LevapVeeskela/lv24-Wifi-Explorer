import '../workbench_prefs/workbench_pref_store.dart';
import 'organize_by.dart';

/// Loads/saves [OrganizeByValue] through [WorkbenchPrefStore].
class OrganizePersist {
  const OrganizePersist({WorkbenchPrefStore store = const WorkbenchPrefStore()})
    : _store = store;

  final WorkbenchPrefStore _store;

  Future<OrganizeByValue> load() async {
    final raw = await _store.read(organizeByStorageKey);
    return organizeByFromWire(raw);
  }

  Future<void> save(OrganizeByValue value) =>
      _store.write(organizeByStorageKey, organizeByToWire(value));
}
