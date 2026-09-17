import { describe, expect, it } from 'vitest';
import {
  PERCENT_FULL_DBM,
  PERCENT_ZERO_DBM,
  computeSignalView,
  isNoiseValid,
  percentFromDbm,
  quality,
  qualityBasisOf,
  snr,
} from './signal';

describe('snr', () => {
  it('equals rssi minus noise when noise is valid', () => {
    expect(snr(-50, -90)).toBe(40);
    expect(snr(-70, -80)).toBe(10);
    expect(snr(-50, -20)).toBe(-30);
    expect(snr(-50, -120)).toBe(70);
  });

  it('returns null for invalid noise (0, out of range, non-finite)', () => {
    expect(isNoiseValid(0)).toBe(false);
    expect(snr(-50, 0)).toBeNull();
    expect(snr(-50, -19)).toBeNull();
    expect(snr(-50, -121)).toBeNull();
    expect(snr(-50, 127)).toBeNull();
    expect(snr(-50, Number.NaN)).toBeNull();
  });
});

describe('quality', () => {
  it('uses SNR table first', () => {
    expect(quality(-50, -90)).toBe('excellent');
    expect(quality(-70, -80)).toBe('poor');
    expect(quality(-70, -79)).toBe('unusable');
    expect(qualityBasisOf(-90)).toBe('snr');
  });

  it('falls back to RSSI when noise is invalid', () => {
    expect(quality(-50, 0)).toBe('excellent');
    expect(quality(-60, 0)).toBe('good');
    expect(quality(-81, 0)).toBe('unusable');
    expect(qualityBasisOf(0)).toBe('rssi-fallback');
    expect(computeSignalView(-50, 0).snrDb).toBeNull();
    expect(computeSignalView(-50, 0).noiseDbm).toBeNull();
    expect(computeSignalView(-50, 0).qualityBasis).toBe('rssi-fallback');
  });
});

describe('percentFromDbm', () => {
  it('maps default zero=-100 / full=-50 linearly', () => {
    expect(PERCENT_ZERO_DBM).toBe(-100);
    expect(PERCENT_FULL_DBM).toBe(-50);
    expect(percentFromDbm(-100)).toBe(0);
    expect(percentFromDbm(-50)).toBe(100);
    expect(percentFromDbm(-75)).toBe(50);
  });

  it('never returns a negative percent', () => {
    expect(percentFromDbm(-200)).toBe(0);
    expect(percentFromDbm(-30)).toBe(100);
    expect(percentFromDbm(Number.NaN)).toBe(0);
    expect(percentFromDbm(-80, -80, -80)).toBe(0);
    expect(percentFromDbm(-120, -100, -50)).toBeGreaterThanOrEqual(0);
  });
});
