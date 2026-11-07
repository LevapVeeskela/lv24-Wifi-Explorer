import 'package:scan_domain/scan_domain.dart';

import 'chart_timescale.dart';

class SignalSeriesPoint {
  const SignalSeriesPoint({required this.at, required this.y});

  final DateTime at;
  final double y;
}

double _pointY(double rssiDbm, SignalChartUnit unit) {
  return unit == SignalChartUnit.dbm
      ? rssiDbm
      : percentFromDbm(rssiDbm).toDouble();
}

List<SignalSeriesPoint> filterSeriesByTimescale(
  List<SignalSeriesPoint> points,
  ChartTimescale timescale,
  int nowMs,
) {
  final windowMs = timescaleWindowMs(timescale);
  final last = points.isEmpty ? null : points.last;
  final anchor = last != null ? (nowMs > last.at.millisecondsSinceEpoch ? nowMs : last.at.millisecondsSinceEpoch) : nowMs;
  final start = anchor - windowMs;
  return points.where((point) {
    final t = point.at.millisecondsSinceEpoch;
    return t >= start && t <= anchor;
  }).toList();
}

List<SignalSeriesPoint> buildSignalSeries(
  ObservedBss? bss,
  SignalChartUnit unit, {
  ChartTimescale? timescale,
  int? nowMs,
}) {
  if (bss == null) return [];

  final raw = <SignalSeriesPoint>[];
  if (bss.rssiHistory.isNotEmpty) {
    for (final point in bss.rssiHistory) {
      final at = DateTime.tryParse(point.at);
      if (at == null) continue;
      raw.add(SignalSeriesPoint(at: at.toUtc(), y: _pointY(point.rssiDbm, unit)));
    }
  } else {
    final at = DateTime.tryParse(bss.presence.lastSeenAt);
    if (at != null) {
      raw.add(
        SignalSeriesPoint(
          at: at.toUtc(),
          y: _pointY(bss.signal.rssiDbm, unit),
        ),
      );
    }
  }

  if (timescale == null) return raw;
  final filtered = filterSeriesByTimescale(raw, timescale, nowMs ?? DateTime.now().millisecondsSinceEpoch);
  if (filtered.isNotEmpty) return filtered;
  return raw.isEmpty ? raw : [raw.last];
}
