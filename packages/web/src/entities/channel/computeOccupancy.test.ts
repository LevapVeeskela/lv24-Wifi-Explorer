import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { ObservedBss } from '@/domain/bss';
import { computeBandOccupancy } from './computeOccupancy';
import { formatBandWithUnii, uniiSubband } from '@/entities/channel';

function mockBss(partial: {
  bssid: string;
  band: 2.4 | 5 | 6;
  channel: number;
  widthMhz: 20 | 40 | 80 | 160;
  rssiDbm: number;
  from: number;
  to: number;
}): ObservedBss {
  return {
    identity: {
      bssid: { status: 'available', value: partial.bssid },
      ssid: { status: 'redacted', reason: 'location-required' },
    },
    channel: {
      number: partial.channel,
      band: partial.band,
      widthMhz: partial.widthMhz,
      primaryCenterMhz: (partial.from + partial.to) / 2,
      occupyingCenterMhz: (partial.from + partial.to) / 2,
      occupyingSpanMhz: { from: partial.from, to: partial.to },
      centerConfidence: 'ieee-primary-20',
    },
    signal: { rssiDbm: partial.rssiDbm },
  } as unknown as ObservedBss;
}

describe('unii', () => {
  it('formats 5 GHz with UNII-2A', () => {
    assert.equal(uniiSubband(5, 60), 'UNII-2A');
    assert.equal(formatBandWithUnii(5, 60), '5 GHz UNII-2A');
    assert.equal(formatBandWithUnii(2.4, 6), '2.4 GHz');
  });
});

describe('computeBandOccupancy', () => {
  it('scores overlapping 40 MHz on 2.4 and splits selected vs others', () => {
    const selected = mockBss({
      bssid: 'aa:bb:cc:00:00:01',
      band: 2.4,
      channel: 6,
      widthMhz: 40,
      rssiDbm: -40,
      from: 2427,
      to: 2467,
    });
    const neighbor = mockBss({
      bssid: 'aa:bb:cc:00:00:02',
      band: 2.4,
      channel: 6,
      widthMhz: 20,
      rssiDbm: -50,
      from: 2432,
      to: 2452,
    });
    const bars = computeBandOccupancy([selected, neighbor], 2.4, 6, 'aa:bb:cc:00:00:01');
    const ch6 = bars.find((b) => b.channel === 6);
    assert.ok(ch6);
    assert.equal(ch6.selectedHighlight, true);
    assert.ok(ch6.selected > 0);
    assert.ok(ch6.others > 0);
    assert.ok(ch6.score <= 100);
    const ch1 = bars.find((b) => b.channel === 1);
    assert.equal(ch1?.score, 0);
  });

  it('builds 2.4 / 5 / 6 channel axes', () => {
    const empty24 = computeBandOccupancy([], 2.4, null);
    const empty5 = computeBandOccupancy([], 5, null);
    const empty6 = computeBandOccupancy([], 6, null);
    assert.equal(empty24[0]?.channel, 1);
    assert.equal(empty24.at(-1)?.channel, 14);
    assert.ok(empty5.some((b) => b.channel === 36));
    assert.equal(empty6[0]?.channel, 1);
    assert.equal(empty6.at(-1)?.channel, 233);
  });
});
