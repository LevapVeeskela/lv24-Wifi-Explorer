import 'package:flutter/material.dart';

/// Parses `#RRGGBB` or `RRGGBB` (Electron snapshot pin colors).
Color? colorFromHex(String? hex) {
  if (hex == null) return null;
  var s = hex.trim();
  if (s.isEmpty) return null;
  if (s.startsWith('#')) s = s.substring(1);
  if (s.length == 6) s = 'FF$s';
  if (s.length != 8) return null;
  final value = int.tryParse(s, radix: 16);
  if (value == null) return null;
  return Color(value);
}

String colorToHex(Color color) {
  final rgb = color.value & 0xFFFFFF;
  return '#${rgb.toRadixString(16).padLeft(6, '0').toUpperCase()}';
}
