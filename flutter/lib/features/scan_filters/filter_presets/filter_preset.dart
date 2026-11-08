import '../scan_workbench_filters.dart';

/// Matches Electron `STORAGE_FILTER_PRESETS`.
const filterPresetsStorageKey = 'lv24.wifi-explorer.filter-presets';

/// Desktop limits (Electron `MAX_PRESETS` / `MAX_PRESET_NAME_LENGTH`).
const maxFilterPresets = 32;
const maxFilterPresetNameLength = 64;

const _bandWire = <BandFilterValue, String>{
  BandFilterValue.all: 'all',
  BandFilterValue.ghz24: '24',
  BandFilterValue.ghz5: '5',
  BandFilterValue.ghz6: '6',
};

const _securityWire = <SecurityFilterValue, String>{
  SecurityFilterValue.open: 'open',
  SecurityFilterValue.secure: 'secure',
};

String bandFilterToWire(BandFilterValue value) => _bandWire[value] ?? 'all';

BandFilterValue bandFilterFromWire(Object? raw) {
  for (final entry in _bandWire.entries) {
    if (entry.value == raw) return entry.key;
  }
  return BandFilterValue.all;
}

String securityFilterToWire(SecurityFilterValue value) =>
    _securityWire[value] ?? 'open';

SecurityFilterValue? securityFilterFromWire(Object? raw) {
  for (final entry in _securityWire.entries) {
    if (entry.value == raw) return entry.key;
  }
  return null;
}

/// A named, persisted set of workbench filters the user can re-apply.
class FilterPreset {
  const FilterPreset({
    required this.id,
    required this.name,
    required this.filters,
  });

  final String id;
  final String name;
  final ScanWorkbenchFilters filters;

  Map<String, Object?> toJson() => {
    'id': id,
    'name': name,
    'filters': filtersToJson(filters),
  };

  static FilterPreset? fromJson(Object? value) {
    if (value is! Map) return null;
    final id = value['id'];
    final name = value['name'];
    final trimmedId = id is String ? id.trim() : '';
    final trimmedName = name is String ? name.trim() : '';
    if (trimmedId.isEmpty || trimmedName.isEmpty) return null;
    return FilterPreset(
      id: trimmedId,
      name: trimmedName.length > maxFilterPresetNameLength
          ? trimmedName.substring(0, maxFilterPresetNameLength)
          : trimmedName,
      filters: normalizeFilterPresetFilters(value['filters']),
    );
  }
}

/// Persisted preset list, version 1 (Electron `FilterPresetsStoreV1`).
class FilterPresetsStoreV1 {
  const FilterPresetsStoreV1({this.presets = const []});

  static const version = 1;

  final List<FilterPreset> presets;

  static const empty = FilterPresetsStoreV1();

  Map<String, Object?> toJson() => {
    'version': version,
    'presets': [for (final preset in presets) preset.toJson()],
  };

  static FilterPresetsStoreV1? decode(Object? decoded) {
    if (decoded is! Map) return null;
    if (decoded['version'] != version) return null;
    final rawPresets = decoded['presets'];
    final presets = <FilterPreset>[];
    if (rawPresets is List) {
      for (final item in rawPresets) {
        final preset = FilterPreset.fromJson(item);
        if (preset != null) presets.add(preset);
      }
    }
    return FilterPresetsStoreV1(presets: presets);
  }
}

Map<String, Object?> filtersToJson(ScanWorkbenchFilters filters) => {
  'band': bandFilterToWire(filters.band),
  'security': [
    for (final value in filters.security) securityFilterToWire(value),
  ],
  'searchQuery': filters.searchQuery,
  'vendorQuery': filters.vendorQuery,
  'minRssiDbm': filters.minRssiDbm,
  'includeHiddenSsid': filters.includeHiddenSsid,
};

/// Coerces an untrusted filter object into a valid [ScanWorkbenchFilters].
ScanWorkbenchFilters normalizeFilterPresetFilters(Object? partial) {
  final map = partial is Map ? partial : const <Object?, Object?>{};
  const base = ScanWorkbenchFilters.defaults;
  return ScanWorkbenchFilters(
    band: bandFilterFromWire(map['band']),
    security: _normalizeSecurity(map['security']),
    searchQuery: _text(map['searchQuery']),
    vendorQuery: _text(map['vendorQuery']),
    minRssiDbm: _normalizeMinRssi(map['minRssiDbm']),
    includeHiddenSsid: map['includeHiddenSsid'] is bool
        ? map['includeHiddenSsid']! as bool
        : base.includeHiddenSsid,
  );
}

List<SecurityFilterValue> _normalizeSecurity(Object? raw) {
  if (raw is! List) return const [];
  final seen = <SecurityFilterValue>{};
  final out = <SecurityFilterValue>[];
  for (final item in raw) {
    final value = securityFilterFromWire(item);
    if (value != null && seen.add(value)) out.add(value);
  }
  return out;
}

int? _normalizeMinRssi(Object? raw) {
  if (raw is! num) return null;
  final rounded = raw.round();
  if (rounded <= -95) return null;
  if (rounded > -40) return -40;
  return rounded;
}

String _text(Object? raw) => raw is String ? raw : '';

int _idCounter = 0;

String _newPresetId() {
  final stamp = DateTime.now().microsecondsSinceEpoch.toRadixString(36);
  return 'fpreset-$stamp-${_idCounter++}';
}

/// Appends a preset; no-op when the name is blank or the limit is reached.
FilterPresetsStoreV1 createFilterPreset(
  FilterPresetsStoreV1 store,
  String name,
  ScanWorkbenchFilters filters,
) {
  final trimmed = name.trim();
  if (trimmed.isEmpty || store.presets.length >= maxFilterPresets) {
    return store;
  }
  final preset = FilterPreset(
    id: _newPresetId(),
    name: trimmed.length > maxFilterPresetNameLength
        ? trimmed.substring(0, maxFilterPresetNameLength)
        : trimmed,
    filters: filters,
  );
  return FilterPresetsStoreV1(presets: [...store.presets, preset]);
}

FilterPresetsStoreV1 deleteFilterPreset(
  FilterPresetsStoreV1 store,
  String presetId,
) {
  if (!store.presets.any((p) => p.id == presetId)) return store;
  return FilterPresetsStoreV1(
    presets: [
      for (final preset in store.presets)
        if (preset.id != presetId) preset,
    ],
  );
}
