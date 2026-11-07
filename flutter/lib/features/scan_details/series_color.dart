import 'package:flutter/material.dart';

import '../annotations/color_hex.dart';

const _sunsetHues = <Color>[
  Color(0xFFFB6E4A),
  Color(0xFFA78BFA),
  Color(0xFF34D399),
  Color(0xFFFBBF24),
  Color(0xFF38BDF8),
  Color(0xFFFB7185),
  Color(0xFFFCA98B),
  Color(0xFFC4B5FD),
  Color(0xFF6EE7B7),
  Color(0xFFFCD34D),
  Color(0xFF7DD3FC),
  Color(0xFFFDA4AF),
];

int _hashString(String input) {
  var hash = 0;
  for (var i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.codeUnitAt(i);
    hash = hash & hash;
  }
  return hash.abs();
}

Color seriesColorForBssid(String bssid) {
  final index = _hashString(bssid) % _sunsetHues.length;
  return _sunsetHues[index];
}

Color seriesColorForBss(
  String? bssid, {
  Color fallback = const Color(0xFFFB6E4A),
  Map<String, String>? pinnedColors,
}) {
  if (bssid == null || bssid.isEmpty) return fallback;
  final fold = bssid.trim().toLowerCase().replaceAll('-', ':');
  final pinned = pinnedColors?[fold];
  if (pinned != null) {
    final parsed = colorFromHex(pinned);
    if (parsed != null) return parsed;
  }
  return seriesColorForBssid(bssid);
}
