import 'dart:convert';

import '../../workbench_prefs/workbench_pref_store.dart';
import 'filter_preset.dart';

/// Async persistence for [FilterPresetsStoreV1] via [WorkbenchPrefStore].
class FilterPresetsStore {
  const FilterPresetsStore({
    WorkbenchPrefStore store = const WorkbenchPrefStore(),
  }) : _store = store;

  final WorkbenchPrefStore _store;

  Future<FilterPresetsStoreV1> load() async {
    final raw = await _store.read(filterPresetsStorageKey);
    if (raw == null || raw.trim().isEmpty) return FilterPresetsStoreV1.empty;
    try {
      final decoded = jsonDecode(raw);
      return FilterPresetsStoreV1.decode(decoded) ?? FilterPresetsStoreV1.empty;
    } catch (_) {
      return FilterPresetsStoreV1.empty;
    }
  }

  Future<void> save(FilterPresetsStoreV1 store) =>
      _store.write(filterPresetsStorageKey, jsonEncode(store.toJson()));
}
