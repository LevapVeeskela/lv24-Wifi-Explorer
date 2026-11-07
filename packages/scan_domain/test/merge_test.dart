import 'package:scan_domain/scan_domain.dart';
import 'package:test/test.dart';

import 'test_support.dart';

const t0 = '2026-09-17T19:00:00.000Z';

void main() {
  group('presenceFromMisses', () {
    test('stales at missCount 2 and disappears at 3 or 60s', () {
      expect(mergePolicy.staleAfterMisses, 2);
      expect(presenceFromMisses(0, iso(t0), iso(t0)), Presence.current);
      expect(presenceFromMisses(1, iso(t0), iso(atOffset(t0, 10))), Presence.current);
      expect(presenceFromMisses(2, iso(t0), iso(atOffset(t0, 20))), Presence.stale);
      expect(presenceFromMisses(3, iso(t0), iso(atOffset(t0, 30))), Presence.disappeared);
      expect(presenceFromMisses(1, iso(t0), iso(atOffset(t0, 60))), Presence.disappeared);
    });
  });

  group('mergeObservedBssRows', () {
    test('updates lastSeen on sight and rings RSSI history', () {
      final open = makeObservedBss(MakeBssInput(
        bssid: '00:11:22:0e:00:01',
        ssid: 'Cafe',
        capturedAt: t0,
      ));
      final campus = makeObservedBss(MakeBssInput(
        bssid: '00:11:22:0e:00:02',
        ssid: 'Campus',
        capturedAt: t0,
      ));

      var rows = mergeObservedBssRows([], [open, campus], t0);
      expect(
        rows
            .where((r) => r.lastRaw.bssid == open.lastRaw.bssid)
            .first
            .presence
            .presence,
        Presence.current,
      );

      rows = mergeObservedBssRows(rows, [campus], atOffset(t0, 8));
      final miss1 = rows.firstWhere((r) => r.lastRaw.bssid == open.lastRaw.bssid);
      expect(miss1.presence.consecutiveMisses, 1);
      expect(miss1.presence.presence, Presence.current);
      expect(miss1.presence.lastSeenAt, iso(t0));

      rows = mergeObservedBssRows(rows, [campus], atOffset(t0, 16));
      final miss2 = rows.firstWhere((r) => r.lastRaw.bssid == open.lastRaw.bssid);
      expect(miss2.presence.consecutiveMisses, 2);
      expect(miss2.presence.presence, Presence.stale);

      rows = mergeObservedBssRows(rows, [campus], atOffset(t0, 24));
      final miss3 = rows.firstWhere((r) => r.lastRaw.bssid == open.lastRaw.bssid);
      expect(miss3.presence.consecutiveMisses, 3);
      expect(miss3.presence.presence, Presence.disappeared);

      final seenAgain = makeObservedBss(MakeBssInput(
        bssid: '00:11:22:0e:00:01',
        ssid: 'Cafe',
        rssiDbm: -40,
        capturedAt: atOffset(t0, 32),
        lastSeenAt: atOffset(t0, 32),
      ));
      rows = mergeObservedBssRows(rows, [seenAgain, campus], atOffset(t0, 32));
      final back = rows.firstWhere((r) => r.lastRaw.bssid == open.lastRaw.bssid);
      expect(back.presence.presence, Presence.current);
      expect(back.presence.consecutiveMisses, 0);
      expect(back.presence.lastSeenAt, iso(atOffset(t0, 32)));
      expect(back.presence.firstSeenAt, iso(t0));

      final aged = makeObservedBss(MakeBssInput(
        bssid: '00:11:22:0e:00:01',
        ssid: 'Cafe',
        capturedAt: t0,
      ));
      final oldPoint = RssiHistoryPoint(
        at: iso('2026-09-17T18:49:00.000Z'),
        rssiDbm: -80,
        noiseDbm: -90,
        snrDb: 10,
        channelNumber: 6,
      );
      final filled = ObservedBss(
        identity: aged.identity,
        ibss: aged.ibss,
        countryCode: aged.countryCode,
        beaconIntervalMs: aged.beaconIntervalMs,
        signal: aged.signal,
        channel: aged.channel,
        security: aged.security,
        phy: aged.phy,
        maxRate: aged.maxRate,
        vendor: aged.vendor,
        ie: aged.ie,
        presence: aged.presence,
        rssiHistory: [
          oldPoint,
          ...List.generate(
            119,
            (i) => RssiHistoryPoint(
              at: iso(DateTime.fromMillisecondsSinceEpoch(
                DateTime.parse(t0).millisecondsSinceEpoch - (119 - i) * 1000,
                isUtc: true,
              ).toIso8601String()),
              rssiDbm: -70,
              noiseDbm: -90,
              snrDb: 20,
              channelNumber: 6,
            ),
          ),
        ],
        lastRaw: aged.lastRaw,
      );
      final next = makeObservedBss(MakeBssInput(
        bssid: '00:11:22:0e:00:01',
        ssid: 'Cafe',
        capturedAt: t0,
        lastSeenAt: t0,
      ));
      final merged = mergeObservedBssRows([filled], [next], t0);
      expect(
        merged.first.rssiHistory.length,
        lessThanOrEqualTo(presencePolicy.historyMaxPoints),
      );
      expect(merged.first.rssiHistory.any((p) => p.at == oldPoint.at), isFalse);
      expect(merged.first.rssiHistory.last.at, iso(t0));
    });
  });
}
