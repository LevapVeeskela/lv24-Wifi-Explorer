import 'package:flutter/material.dart';
import 'package:scan_domain/scan_domain.dart';

import '../annotations/resolve_series_color.dart';
import '../scan_details/series_color.dart';

/// Normalized BSSID for pin / series color lookup (Electron fold rules).
String? pinLookupBssid(ObservedBss bss) {
  final gated = bss.identity.bssid;
  if (gated is! LocationAvailable<String>) return null;
  final normalized = normalizeBssid(gated.value);
  if (normalized == null || normalized.isEmpty) return null;
  return normalized;
}

/// Chart / grid color: pinned hex overrides the default BSSID hash palette.
Color seriesColorForRow(
  ObservedBss bss, {
  Map<String, String>? pinnedColors,
}) {
  final bssid = pinLookupBssid(bss);
  if (bssid == null) {
    return seriesColorForBss(null);
  }
  return seriesColorForBssidWithPins(bssid, pinnedColors: pinnedColors);
}
