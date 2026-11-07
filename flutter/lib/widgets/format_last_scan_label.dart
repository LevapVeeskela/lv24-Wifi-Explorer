/// Relative last-scan label (Electron `formatLastScanLabel`).
String formatLastScanLabel(DateTime? at, {DateTime? now}) {
  if (at == null) return '—';
  final clock = now ?? DateTime.now();
  final deltaSec = clock.difference(at.toLocal()).inSeconds;
  if (deltaSec < 2) return 'now';
  if (deltaSec < 60) return '${deltaSec}s';
  if (deltaSec < 3600) return '${(deltaSec / 60).round()}m';
  return '${(deltaSec / 3600).round()}h';
}
