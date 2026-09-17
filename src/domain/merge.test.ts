import { describe, expect, it } from 'vitest';
import { PRESENCE_POLICY } from './timeseries';
import { MERGE_POLICY, mergeObservedBssRows, presenceFromMisses } from './merge';
import { iso, makeObservedBss } from './testSupport';
import type { RssiHistoryPoint } from './timeseries';

const T0 = '2026-09-17T19:00:00.000Z';

function at(seconds: number): string {
  return new Date(Date.parse(T0) + seconds * 1000).toISOString();
}

describe('presenceFromMisses', () => {
  it('stales at missCount 2 and disappears at 3 or 60s', () => {
    expect(MERGE_POLICY.staleAfterMisses).toBe(2);
    expect(presenceFromMisses(0, iso(T0), iso(T0))).toBe('current');
    expect(presenceFromMisses(1, iso(T0), iso(at(10)))).toBe('current');
    expect(presenceFromMisses(2, iso(T0), iso(at(20)))).toBe('stale');
    expect(presenceFromMisses(3, iso(T0), iso(at(30)))).toBe('disappeared');
    expect(presenceFromMisses(1, iso(T0), iso(at(60)))).toBe('disappeared');
  });
});

describe('mergeObservedBssRows', () => {
  it('updates lastSeen on sight and rings RSSI history', () => {
    const open = makeObservedBss({
      bssid: '00:11:22:0e:00:01',
      ssid: 'Cafe',
      capturedAt: T0,
    });
    const campus = makeObservedBss({
      bssid: '00:11:22:0e:00:02',
      ssid: 'Campus',
      capturedAt: T0,
    });

    let rows = mergeObservedBssRows([], [open, campus], T0);
    expect(rows.find((r) => r.lastRaw.bssid === open.lastRaw.bssid)?.presence.presence).toBe(
      'current',
    );

    rows = mergeObservedBssRows(rows, [campus], at(8));
    const miss1 = rows.find((r) => r.lastRaw.bssid === open.lastRaw.bssid)!;
    expect(miss1.presence.consecutiveMisses).toBe(1);
    expect(miss1.presence.presence).toBe('current');
    expect(miss1.presence.lastSeenAt).toBe(iso(T0));

    rows = mergeObservedBssRows(rows, [campus], at(16));
    const miss2 = rows.find((r) => r.lastRaw.bssid === open.lastRaw.bssid)!;
    expect(miss2.presence.consecutiveMisses).toBe(2);
    expect(miss2.presence.presence).toBe('stale');

    rows = mergeObservedBssRows(rows, [campus], at(24));
    const miss3 = rows.find((r) => r.lastRaw.bssid === open.lastRaw.bssid)!;
    expect(miss3.presence.consecutiveMisses).toBe(3);
    expect(miss3.presence.presence).toBe('disappeared');

    const seenAgain = makeObservedBss({
      bssid: '00:11:22:0e:00:01',
      ssid: 'Cafe',
      rssiDbm: -40,
      capturedAt: at(32),
      lastSeenAt: at(32),
    });
    rows = mergeObservedBssRows(rows, [seenAgain, campus], at(32));
    const back = rows.find((r) => r.lastRaw.bssid === open.lastRaw.bssid)!;
    expect(back.presence.presence).toBe('current');
    expect(back.presence.consecutiveMisses).toBe(0);
    expect(back.presence.lastSeenAt).toBe(iso(at(32)));
    expect(back.presence.firstSeenAt).toBe(iso(T0));

    const aged = makeObservedBss({ bssid: '00:11:22:0e:00:01', ssid: 'Cafe', capturedAt: T0 });
    const oldPoint: RssiHistoryPoint = {
      at: iso('2026-09-17T18:49:00.000Z'),
      rssiDbm: -80,
      noiseDbm: -90,
      snrDb: 10,
      channelNumber: 6,
    };
    const filled = {
      ...aged,
      rssiHistory: [
        oldPoint,
        ...Array.from({ length: 119 }, (_, i) => ({
          at: iso(new Date(Date.parse(T0) - (119 - i) * 1000).toISOString()),
          rssiDbm: -70,
          noiseDbm: -90,
          snrDb: 20,
          channelNumber: 6,
        })),
      ],
    };
    const next = makeObservedBss({
      bssid: '00:11:22:0e:00:01',
      ssid: 'Cafe',
      capturedAt: T0,
      lastSeenAt: T0,
    });
    const merged = mergeObservedBssRows([filled], [next], T0);
    expect(merged[0]!.rssiHistory.length).toBeLessThanOrEqual(PRESENCE_POLICY.historyMaxPoints);
    expect(merged[0]!.rssiHistory.some((p) => p.at === oldPoint.at)).toBe(false);
    expect(merged[0]!.rssiHistory.at(-1)?.at).toBe(iso(T0));
  });
});
