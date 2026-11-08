import 'package:scan_domain/scan_domain.dart';

import 'organize_by.dart';

/// Stable group tokens used for grouping (not necessarily the display label).
const organizeHiddenSsidKey = '\u2039hidden\u203a';
const organizeRedactedKey = 'redacted';
const organizeUnknownKey = '\u2014';

/// Default (non-localized) group labels — desktop parity fallbacks.
const organizeHiddenSsidLabel = '\u2039hidden\u203a';
const organizeRedactedLabel = 'redacted';
const organizeUnknownLabel = '\u2014';

class ScanRowGroup {
  const ScanRowGroup({
    required this.key,
    required this.label,
    required this.rows,
  });

  /// Deterministic grouping key (SSID, BSSID, or lower-cased vendor).
  final String key;

  /// Display label shown in the group header row.
  final String label;

  final List<ObservedBss> rows;
}

String _ssidGroupKey(ObservedBss row) {
  final gated = row.identity.ssid;
  if (gated is LocationAvailable<SsidIdentity>) {
    if (gated.value.hidden || gated.value.displayName.isEmpty) {
      return organizeHiddenSsidKey;
    }
    return gated.value.displayName;
  }
  return organizeRedactedKey;
}

String _bssidGroupKey(ObservedBss row) {
  final gated = row.identity.bssid;
  if (gated is LocationAvailable<Bssid>) {
    return normalizeBssid(gated.value) ?? gated.value.toLowerCase();
  }
  return organizeRedactedKey;
}

String _vendorGroupKey(ObservedBss row) {
  final organization = row.vendor.organization?.trim() ?? '';
  return organization.isEmpty ? organizeUnknownKey : organization.toLowerCase();
}

String organizeGroupKey(ObservedBss row, OrganizeByValue mode) {
  return switch (mode) {
    OrganizeByValue.ssid => _ssidGroupKey(row),
    OrganizeByValue.ap => _bssidGroupKey(row),
    OrganizeByValue.vendor => _vendorGroupKey(row),
    OrganizeByValue.none => '',
  };
}

/// Group header label; `unknown` / `redacted` / `hiddenSsid` are localized by
/// the caller when available.
String organizeGroupLabel(
  ObservedBss row,
  OrganizeByValue mode, {
  String hiddenSsid = organizeHiddenSsidLabel,
  String redacted = organizeRedactedLabel,
  String unknown = organizeUnknownLabel,
}) {
  switch (mode) {
    case OrganizeByValue.ssid:
      final key = _ssidGroupKey(row);
      return switch (key) {
        organizeHiddenSsidKey => hiddenSsid,
        organizeRedactedKey => redacted,
        _ => key,
      };
    case OrganizeByValue.ap:
      final key = _bssidGroupKey(row);
      return key == organizeRedactedKey ? redacted : key;
    case OrganizeByValue.vendor:
      final key = _vendorGroupKey(row);
      return key == organizeUnknownKey ? unknown : key;
    case OrganizeByValue.none:
      return '';
  }
}

/// Groups [rows] in first-appearance order, preserving the incoming sort.
List<ScanRowGroup> groupScanRows(
  List<ObservedBss> rows,
  OrganizeByValue mode, {
  String Function(ObservedBss row)? labelFor,
}) {
  if (mode == OrganizeByValue.none) {
    return [
      ScanRowGroup(
        key: '',
        label: '',
        rows: List<ObservedBss>.unmodifiable(rows),
      ),
    ];
  }
  final order = <String>[];
  final buckets = <String, List<ObservedBss>>{};
  final labels = <String, String>{};
  final resolveLabel =
      labelFor ?? (ObservedBss row) => organizeGroupLabel(row, mode);
  for (final row in rows) {
    final key = organizeGroupKey(row, mode);
    final bucket = buckets.putIfAbsent(key, () {
      order.add(key);
      return <ObservedBss>[];
    });
    bucket.add(row);
    labels.putIfAbsent(key, () => resolveLabel(row));
  }
  return [
    for (final key in order)
      ScanRowGroup(
        key: key,
        label: labels[key]!,
        rows: List<ObservedBss>.unmodifiable(buckets[key]!),
      ),
  ];
}
