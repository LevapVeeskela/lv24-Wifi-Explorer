import 'identity.dart';

class RssiHistoryPoint {
  const RssiHistoryPoint({
    required this.at,
    required this.rssiDbm,
    required this.noiseDbm,
    required this.snrDb,
    required this.channelNumber,
  });

  final IsoTime at;
  final double rssiDbm;
  final double? noiseDbm;
  final double? snrDb;
  final int? channelNumber;
}

enum Presence { current, stale, disappeared }

class PresenceView {
  const PresenceView({
    required this.firstSeenAt,
    required this.lastSeenAt,
    required this.lastMissingAt,
    required this.consecutiveMisses,
    required this.presence,
  });

  final IsoTime firstSeenAt;
  final IsoTime lastSeenAt;
  final IsoTime? lastMissingAt;
  final int consecutiveMisses;
  final Presence presence;
}

const presencePolicy = (
  staleAfterMisses: 1,
  disappearedAfterMisses: 3,
  historyMaxPoints: 120,
  historyMaxAgeSeconds: 600,
);

List<RssiHistoryPoint> pruneRssiHistory(
  List<RssiHistoryPoint> points,
  IsoTime now,
) {
  final end = DateTime.tryParse(now)?.millisecondsSinceEpoch;
  if (end == null) {
    final start = points.length - presencePolicy.historyMaxPoints;
    return points.sublist(start < 0 ? 0 : start);
  }
  final minAt = end - presencePolicy.historyMaxAgeSeconds * 1000;
  final kept = points.where((p) {
    final t = DateTime.tryParse(p.at)?.millisecondsSinceEpoch;
    return t != null && t >= minAt && t <= end;
  }).toList();
  if (kept.length <= presencePolicy.historyMaxPoints) return kept;
  return kept.sublist(kept.length - presencePolicy.historyMaxPoints);
}

List<RssiHistoryPoint> stitchRssiHistory(
  List<RssiHistoryPoint> prev,
  List<RssiHistoryPoint> next,
  IsoTime now,
) {
  final byAt = <String, RssiHistoryPoint>{};
  for (final point in prev) {
    byAt[point.at] = point;
  }
  for (final point in next) {
    byAt[point.at] = point;
  }
  final merged = byAt.values.toList()
    ..sort((a, b) {
      final ta = DateTime.tryParse(a.at)?.millisecondsSinceEpoch ?? 0;
      final tb = DateTime.tryParse(b.at)?.millisecondsSinceEpoch ?? 0;
      return ta.compareTo(tb);
    });
  return pruneRssiHistory(merged, now);
}

List<RssiHistoryPoint> appendRssiHistory(
  List<RssiHistoryPoint> points,
  RssiHistoryPoint point,
  IsoTime now,
) {
  return stitchRssiHistory(points, [point], now);
}
