import 'package:flutter/material.dart';

import '../scan_details/series_color.dart';
import 'color_hex.dart';

/// Series / chart color: pinned hex overrides the default BSSID hash palette.
Color seriesColorForBssidWithPins(
  String bssid, {
  Map<String, String>? pinnedColors,
}) {
  final fold = bssid.trim().toLowerCase().replaceAll('-', ':');
  final pinned = pinnedColors?[fold];
  if (pinned != null) {
    final parsed = colorFromHex(pinned);
    if (parsed != null) return parsed;
  }
  return seriesColorForBssid(bssid);
}

String? pinnedHexForBssid(String bssid, Map<String, String> pinnedColors) {
  final fold = bssid.trim().toLowerCase().replaceAll('-', ':');
  return pinnedColors[fold];
}
