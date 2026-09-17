import { describe, expect, it } from 'vitest';
import { OCCUPANCY_KIND, computeBandOccupancy, occupancyScore } from './occupancy';
import { makeObservedBss } from './testSupport';

describe('occupancy score', () => {
  it('scores overlapping BSS by rssi and width, labeled not CCA', () => {
    const strong20 = makeObservedBss({
      bssid: '00:11:22:00:00:01',
      band: 5,
      channel: 36,
      widthMhz: 80,
      rssiDbm: -50,
    });
    const bars = computeBandOccupancy([strong20], 5, 36);
    expect(bars.every((bar) => bar.source === OCCUPANCY_KIND)).toBe(true);
    expect(bars.find((bar) => bar.channel === 36)?.selected).toBe(true);

    const on36 = bars.find((bar) => bar.channel === 36)?.score ?? 0;
    const on40 = bars.find((bar) => bar.channel === 40)?.score ?? 0;
    const on48 = bars.find((bar) => bar.channel === 48)?.score ?? 0;
    const on149 = bars.find((bar) => bar.channel === 149)?.score ?? 0;
    expect(on36).toBeGreaterThan(0);
    expect(on40).toBeGreaterThan(0);
    expect(on48).toBeGreaterThan(0);
    expect(on149).toBe(0);
    expect(on36).toBeLessThanOrEqual(100);

    const weak = makeObservedBss({
      bssid: '00:11:22:00:00:02',
      band: 5,
      channel: 36,
      widthMhz: 20,
      rssiDbm: -90,
    });
    expect(occupancyScore([strong20], 5, 36)).toBeGreaterThan(occupancyScore([weak], 5, 36));
  });

  it('spreads 2.4 GHz 20 MHz energy onto overlapping neighbors', () => {
    const ch6 = makeObservedBss({
      bssid: '00:11:22:00:00:03',
      band: 2.4,
      channel: 6,
      widthMhz: 20,
      rssiDbm: -50,
    });
    expect(occupancyScore([ch6], 2.4, 6)).toBeGreaterThan(occupancyScore([ch6], 2.4, 4));
    expect(occupancyScore([ch6], 2.4, 4)).toBeGreaterThan(0);
    expect(occupancyScore([ch6], 2.4, 1)).toBe(0);
  });
});
