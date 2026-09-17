import { describe, expect, it } from 'vitest';
import {
  MAX_RATE_1SS_LONG_GI_MBPS,
  estimateMaxRateFromMcs,
  estimatePhyMaxRate,
  lookupMcsMbps,
} from './phy-rates';

describe('lookupMcsMbps (public long-GI tables)', () => {
  it('HT MCS7 long GI matches IEEE 65 / 135 × NSS', () => {
    expect(lookupMcsMbps({ family: 'ht', mcs: 7, nss: 1, widthMhz: 20 })).toBe(65);
    expect(lookupMcsMbps({ family: 'ht', mcs: 7, nss: 2, widthMhz: 40 })).toBe(270);
    expect(lookupMcsMbps({ family: 'ht', mcs: 7, nss: 8, widthMhz: 20 })).toBeNull();
    expect(lookupMcsMbps({ family: 'ht', mcs: 7, nss: 1, widthMhz: 80 })).toBeNull();
  });

  it('VHT long GI never yields 866.7 (that is short GI 80/2SS/MCS9)', () => {
    expect(lookupMcsMbps({ family: 'vht', mcs: 9, nss: 1, widthMhz: 80 })).toBe(390);
    expect(lookupMcsMbps({ family: 'vht', mcs: 9, nss: 2, widthMhz: 80 })).toBe(780);
    expect(lookupMcsMbps({ family: 'vht', mcs: 9, nss: 2, widthMhz: 80 })).not.toBe(866.7);
    expect(lookupMcsMbps({ family: 'vht', mcs: 9, nss: 2, widthMhz: 80, gi: 'short' })).toBeNull();
    expect(lookupMcsMbps({ family: 'vht', mcs: 9, nss: 1, widthMhz: 20 })).toBeNull();
    expect(lookupMcsMbps({ family: 'vht', mcs: 9, nss: 3, widthMhz: 20 })).toBeCloseTo(260.1);
  });

  it('HE long GI uses 3.2 μs table (MCS9/11)', () => {
    expect(lookupMcsMbps({ family: 'he', mcs: 9, nss: 1, widthMhz: 80 })).toBe(480.4);
    expect(lookupMcsMbps({ family: 'he', mcs: 9, nss: 2, widthMhz: 80 })).toBeCloseTo(960.8);
    expect(lookupMcsMbps({ family: 'he', mcs: 11, nss: 1, widthMhz: 80 })).toBe(600.4);
    expect(lookupMcsMbps({ family: 'he', mcs: 11, nss: 2, widthMhz: 20 })).toBeCloseTo(286.8);
  });
});

describe('estimatePhyMaxRate', () => {
  it('NSS known → ie-nss-mcs; 1SS × nss from conservative ceiling', () => {
    const known = estimatePhyMaxRate({
      supported: ['a', 'n', 'ac', 'ax'],
      widthMhz: 80,
      nss: 2,
    });
    expect(known).toMatchObject({ status: 'known', mbps1ss: 480, mbps: 960, nss: 2, family: 'he' });
    const est = estimateMaxRateFromMcs({
      supported: ['a', 'n', 'ac', 'ax'],
      widthMhz: 80,
      nss: 2,
    });
    expect(est).toEqual({
      mbpsLow: 480,
      mbpsHigh: 960,
      basis: 'ie-nss-mcs',
      nssUsed: 2,
      disclaimer: 'not-a-link-speed',
    });
    expect(est?.mbpsHigh).not.toBe(866.7);
    expect(est?.mbpsLow).not.toBe(866.7);
  });

  it('NSS unknown → range (1SS low, high null), not a fake 866.7', () => {
    const range = estimatePhyMaxRate({
      supported: ['b', 'g', 'n'],
      widthMhz: 20,
      nss: null,
    });
    expect(range).toMatchObject({
      status: 'range',
      mbpsLow: 65,
      mbpsHigh: null,
      nss: null,
    });
    const est = estimateMaxRateFromMcs({
      supported: ['b', 'g', 'n'],
      widthMhz: 20,
      nss: null,
    });
    expect(est).toEqual({
      mbpsLow: 65,
      mbpsHigh: null,
      basis: 'phy-width-1ss-long-gi',
      nssUsed: 1,
      disclaimer: 'not-a-link-speed',
    });
  });

  it('does not estimate EHT / 320 / be-only', () => {
    expect(estimatePhyMaxRate({ supported: ['be'], widthMhz: 80, nss: 2 })).toEqual({
      status: 'unknown',
      reason: 'eht-unsupported',
    });
    expect(estimatePhyMaxRate({ supported: ['ax'], widthMhz: 320, nss: 2 })).toEqual({
      status: 'unknown',
      reason: 'eht-unsupported',
    });
    expect(estimateMaxRateFromMcs({ supported: ['be'], widthMhz: 80, nss: null })).toBeNull();
  });

  it('uses IE max MCS when present (HE MCS11), not 866.7', () => {
    const he11 = estimatePhyMaxRate({
      supported: ['ax'],
      widthMhz: 80,
      nss: 2,
      maxMcs: 11,
    });
    expect(he11.status).toBe('known');
    if (he11.status !== 'known') return;
    expect(he11.mbps1ss).toBe(600.4);
    expect(he11.mbps).toBeCloseTo(1200.8);
    expect(he11.mbps).not.toBe(866.7);
  });

  it('keeps 1SS ceiling table aligned with public HT/VHT/HE long GI', () => {
    expect(MAX_RATE_1SS_LONG_GI_MBPS.n[20]).toBe(65);
    expect(MAX_RATE_1SS_LONG_GI_MBPS.ac[80]).toBe(390);
    expect(MAX_RATE_1SS_LONG_GI_MBPS.ax[80]).toBe(480);
    expect(Object.values(MAX_RATE_1SS_LONG_GI_MBPS).flatMap((row) => Object.values(row))).not.toContain(
      866.7,
    );
  });
});
