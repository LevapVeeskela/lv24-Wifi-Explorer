import { describe, expect, it } from 'vitest';
import {
  UNII_SUBBAND_TABLE,
  band,
  computeChannelView,
  isDfsUnii,
  primaryCenterMhz,
  uniiSubband,
  uniiSubbandFromMhz,
} from './channel';

describe('band', () => {
  it('normalizes CoreWLAN band to 2.4 / 5 / 6', () => {
    expect(band('2ghz')).toBe(2.4);
    expect(band('5ghz')).toBe(5);
    expect(band('6ghz')).toBe(6);
    expect(band('unknown')).toBe('unknown');
  });
});

describe('primaryCenterMhz', () => {
  it('uses IEEE 2.4 / 5 / 6 formulas including ch14', () => {
    expect(primaryCenterMhz(2.4, 1)).toBe(2412);
    expect(primaryCenterMhz(2.4, 6)).toBe(2437);
    expect(primaryCenterMhz(2.4, 14)).toBe(2484);
    expect(primaryCenterMhz(5, 36)).toBe(5180);
    expect(primaryCenterMhz(6, 5)).toBe(5975);
    expect(primaryCenterMhz('unknown', 6)).toBeNull();
    expect(primaryCenterMhz(2.4, 0)).toBeNull();
  });
});

describe('UNII subband tables', () => {
  it('covers UNII-1…4 on 5 GHz and UNII-5…8 on 6 GHz', () => {
    expect(UNII_SUBBAND_TABLE.map((row) => row.id)).toEqual([
      'unii-1',
      'unii-2a',
      'unii-2c',
      'unii-3',
      'unii-4',
      'unii-5',
      'unii-6',
      'unii-7',
      'unii-8',
    ]);
    expect(uniiSubband(2.4, 6)).toBe('none');
    expect(uniiSubband(5, 36)).toBe('unii-1');
    expect(uniiSubband(5, 52)).toBe('unii-2a');
    expect(uniiSubband(5, 100)).toBe('unii-2c');
    expect(uniiSubband(5, 149)).toBe('unii-3');
    expect(uniiSubband(5, 173)).toBe('unii-4');
    expect(uniiSubband(6, 5)).toBe('unii-5');
    expect(uniiSubband(6, 97)).toBe('unii-6');
    expect(uniiSubband(6, 117)).toBe('unii-7');
    expect(uniiSubband(6, 189)).toBe('unii-8');
    expect(isDfsUnii('unii-2a')).toBe(true);
    expect(isDfsUnii('unii-2c')).toBe(true);
    expect(isDfsUnii('unii-1')).toBe(false);
    expect(uniiSubbandFromMhz(5180)).toBe('unii-1');
  });
});

describe('computeChannelView', () => {
  it('sets occupying = primary at 20 MHz', () => {
    const view = computeChannelView(6, '2ghz', '20mhz');
    expect(view.band).toBe(2.4);
    expect(view.primaryCenterMhz).toBe(2437);
    expect(view.occupyingCenterMhz).toBe(2437);
    expect(view.centerConfidence).toBe('ieee-primary-20');
  });

  it('guesses standard 80 MHz block on 5 GHz without IE', () => {
    const view = computeChannelView(36, '5ghz', '80mhz');
    expect(view.primaryCenterMhz).toBe(5180);
    expect(view.occupyingCenterMhz).toBe(5210);
    expect(view.centerConfidence).toBe('standard-layout-guess');
    expect(view.occupyingSpanMhz).toEqual({ from: 5170, to: 5250 });
  });
});
