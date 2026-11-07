import 'bss.dart';
import 'channel.dart';
import 'identity.dart';
import 'timeseries.dart';

const mergePolicy = (
  staleAfterMisses: 2,
  disappearedAfterMisses: 3,
  disappearedAfterSeconds: 60,
);

double _secondsSince(IsoTime from, IsoTime to) {
  final a = DateTime.tryParse(from)?.millisecondsSinceEpoch;
  final b = DateTime.tryParse(to)?.millisecondsSinceEpoch;
  if (a == null || b == null) return 0.0;
  return (b - a) / 1000;
}

Presence presenceFromMisses(
  int missCount,
  IsoTime lastSeenAt,
  IsoTime now,
) {
  final age = _secondsSince(lastSeenAt, now);
  if (missCount >= mergePolicy.disappearedAfterMisses ||
      (missCount > 0 && age >= mergePolicy.disappearedAfterSeconds)) {
    return Presence.disappeared;
  }
  if (missCount >= mergePolicy.staleAfterMisses) return Presence.stale;
  return Presence.current;
}

String _rowKey(ObservedBss bss) {
  final raw = bss.lastRaw;
  return bssMatchKeyFromRaw(
    bssid: raw.bssid,
    ssidData: raw.ssidData,
    ssid: raw.ssid,
    channelNumber: raw.channelNumber,
    channelBand: coreWlanChannelBandKey(raw.channelBand),
    ibss: raw.ibss,
  );
}

List<RssiHistoryPoint> _historySource(ObservedBss bss, IsoTime capturedAt) {
  if (bss.rssiHistory.isNotEmpty) return bss.rssiHistory;
  return [
    RssiHistoryPoint(
      at: capturedAt,
      rssiDbm: bss.signal.rssiDbm,
      noiseDbm: bss.signal.noiseDbm,
      snrDb: bss.signal.snrDb,
      channelNumber: bss.channel.number,
    ),
  ];
}

ObservedBss _mergeSeen(
  ObservedBss? prev,
  ObservedBss next,
  IsoTime capturedAt,
) {
  final lastSeenAt =
      next.presence.lastSeenAt.isNotEmpty ? next.presence.lastSeenAt : capturedAt;
  final presence = PresenceView(
    firstSeenAt: prev?.presence.firstSeenAt ?? next.presence.firstSeenAt,
    lastSeenAt: lastSeenAt,
    lastMissingAt: prev?.presence.lastMissingAt ?? next.presence.lastMissingAt,
    consecutiveMisses: 0,
    presence: Presence.current,
  );
  final prevHistory = prev?.rssiHistory ?? const [];
  return ObservedBss(
    identity: next.identity,
    ibss: next.ibss,
    countryCode: next.countryCode,
    beaconIntervalMs: next.beaconIntervalMs,
    signal: next.signal,
    channel: next.channel,
    security: next.security,
    phy: next.phy,
    maxRate: next.maxRate,
    vendor: next.vendor,
    ie: next.ie,
    presence: presence,
    rssiHistory: stitchRssiHistory(
      prevHistory,
      _historySource(next, capturedAt),
      capturedAt,
    ),
    lastRaw: next.lastRaw,
  );
}

ObservedBss _mergeMissed(ObservedBss prev, IsoTime capturedAt) {
  final consecutiveMisses = prev.presence.consecutiveMisses + 1;
  return ObservedBss(
    identity: prev.identity,
    ibss: prev.ibss,
    countryCode: prev.countryCode,
    beaconIntervalMs: prev.beaconIntervalMs,
    signal: prev.signal,
    channel: prev.channel,
    security: prev.security,
    phy: prev.phy,
    maxRate: prev.maxRate,
    vendor: prev.vendor,
    ie: prev.ie,
    presence: PresenceView(
      firstSeenAt: prev.presence.firstSeenAt,
      lastSeenAt: prev.presence.lastSeenAt,
      lastMissingAt: capturedAt,
      consecutiveMisses: consecutiveMisses,
      presence: presenceFromMisses(
        consecutiveMisses,
        prev.presence.lastSeenAt,
        capturedAt,
      ),
    ),
    rssiHistory: stitchRssiHistory(prev.rssiHistory, const [], capturedAt),
    lastRaw: prev.lastRaw,
  );
}

List<ObservedBss> mergeObservedBssRows(
  List<ObservedBss> prevRows,
  List<ObservedBss> nextRows,
  Object capturedAt,
) {
  final at = asIsoTime(capturedAt);
  final prevByKey = <String, ObservedBss>{};
  for (final row in prevRows) {
    prevByKey[_rowKey(row)] = row;
  }

  final seenKeys = <String>{};
  final merged = <ObservedBss>[];

  for (final next in nextRows) {
    final key = _rowKey(next);
    seenKeys.add(key);
    merged.add(_mergeSeen(prevByKey[key], next, at));
  }

  for (final prev in prevRows) {
    final key = _rowKey(prev);
    if (seenKeys.contains(key)) continue;
    merged.add(_mergeMissed(prev, at));
  }

  return merged;
}
