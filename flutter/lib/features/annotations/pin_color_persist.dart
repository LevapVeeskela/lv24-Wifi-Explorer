import 'dart:convert';

import 'annotation_rule.dart';
import 'string_storage.dart';

const pinnedColorsStorageKey = 'lv24.wifi-explorer.pinned-colors';

PinnedColorEntry? _asPin(Object? value) {
  if (value is! Map) return null;
  final bssid = value['bssid'];
  final color = value['color'];
  if (bssid is! String || color is! String) return null;
  final trimmed = bssid.trim();
  if (trimmed.isEmpty) return null;
  return PinnedColorEntry(bssid: trimmed, color: color.trim());
}

Map<String, String> parsePinnedColorStore(String? raw) {
  if (raw == null || raw.isEmpty) return {};
  try {
    final parsed = jsonDecode(raw);
    if (parsed is List) {
      final out = <String, String>{};
      for (final item in parsed) {
        final pin = _asPin(item);
        if (pin != null) out[_foldBssid(pin.bssid)] = pin.color;
      }
      return out;
    }
    if (parsed is Map) {
      final pins = parsed['pins'];
      if (pins is! List) return {};
      final out = <String, String>{};
      for (final item in pins) {
        final pin = _asPin(item);
        if (pin != null) out[_foldBssid(pin.bssid)] = pin.color;
      }
      return out;
    }
  } catch (_) {
    return {};
  }
  return {};
}

String _foldBssid(String bssid) =>
    bssid.trim().toLowerCase().replaceAll('-', ':');

Map<String, String> loadPinnedColors({StringStorage? storage}) {
  final store = storage;
  if (store == null) return {};
  try {
    return parsePinnedColorStore(store.read(pinnedColorsStorageKey));
  } catch (_) {
    return {};
  }
}

void savePinnedColors(Map<String, String> pins, {StringStorage? storage}) {
  final store = storage;
  if (store == null) return;
  try {
    final entries = pins.entries
        .map((e) => PinnedColorEntry(bssid: e.key, color: e.value))
        .toList()
      ..sort((a, b) => a.bssid.compareTo(b.bssid));
    store.write(
      pinnedColorsStorageKey,
      jsonEncode(PinnedColorStoreV1(pins: entries).toJson()),
    );
  } catch (_) {}
}

Map<String, String> upsertPinnedColor(
  Map<String, String> pins, {
  required String bssid,
  required String color,
}) {
  final key = _foldBssid(bssid);
  return {...pins, key: color};
}

Map<String, String> removePinnedColor(Map<String, String> pins, String bssid) {
  final key = _foldBssid(bssid);
  if (!pins.containsKey(key)) return pins;
  final next = Map<String, String>.from(pins)..remove(key);
  return next;
}
