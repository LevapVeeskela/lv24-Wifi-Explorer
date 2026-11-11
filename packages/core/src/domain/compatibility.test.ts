import { describe, expect, it } from 'vitest';
import { makeObservedBss } from './testSupport';
import type { AdapterCapabilities } from './compatibility';
import { evaluateCompatibility } from './compatibility';

const AX_160: AdapterCapabilities = {
  bands: [2.4, 5, 6],
  phy: ['ax', 'ac', 'n'],
  maxWidthMhz: 160,
  security: ['wpa3-personal', 'wpa3-transition', 'wpa2-personal', 'open'],
  streams: 2,
  interfaceName: 'Wi-Fi',
  source: 'demo',
  estimated: false,
};

function bss(overrides: Parameters<typeof makeObservedBss>[0] = {}) {
  const base = makeObservedBss({
    band: 5,
    channel: 36,
    widthMhz: 160,
    rssiDbm: -50,
    noiseDbm: -92,
    security: 'wpa3-personal',
    ...overrides,
  });
  return {
    ...base,
    phy: { ...base.phy, highest: 'ax' as const, supported: ['ax'] as const },
  };
}

describe('evaluateCompatibility', () => {
  it('scores a matching Wi-Fi 6 / 160 MHz / WPA3 setup as 10', () => {
    const result = evaluateCompatibility(bss(), AX_160);
    expect(result.score).toBe(10);
    expect(result.confidence).toBe('high');
    expect(result.findings).toHaveLength(0);
  });

  it('fails the band factor for a 5 GHz AP when the adapter is 2.4-only', () => {
    const result = evaluateCompatibility(bss(), {
      ...AX_160,
      bands: [2.4],
      phy: ['n'],
      maxWidthMhz: 40,
    });
    expect(result.factors.find((factor) => factor.id === 'band')?.status).toBe('fail');
    expect(result.findings.map((finding) => finding.id)).toContain('bandUnsupported');
    expect(result.score).toBeLessThan(10);
  });

  it('marks an older PHY as partial and suggests both sides', () => {
    const result = evaluateCompatibility(bss(), {
      ...AX_160,
      phy: ['ac'],
      maxWidthMhz: 80,
    });
    expect(result.factors.find((factor) => factor.id === 'phy')?.status).toBe('partial');
    const finding = result.findings.find((item) => item.id === 'phyOlder');
    expect(finding?.side).toBe('both');
  });

  it('marks a narrower adapter channel as partial', () => {
    const result = evaluateCompatibility(bss(), {
      ...AX_160,
      maxWidthMhz: 80,
    });
    expect(result.factors.find((factor) => factor.id === 'width')?.status).toBe('partial');
    expect(result.findings.map((finding) => finding.id)).toContain('widthLimited');
  });

  it('fails security when a WPA3 AP meets a WPA2-only adapter', () => {
    const result = evaluateCompatibility(bss(), {
      ...AX_160,
      security: ['wpa2-personal'],
    });
    expect(result.factors.find((factor) => factor.id === 'security')?.status).toBe('fail');
    expect(result.findings.map((finding) => finding.id)).toContain('securityOlder');
  });

  it('reports weak signal separately from capability mismatches', () => {
    const result = evaluateCompatibility(bss({ rssiDbm: -82, noiseDbm: -95 }), AX_160);
    expect(result.factors.find((factor) => factor.id === 'signal')?.status).toBe('fail');
    expect(result.findings.map((finding) => finding.id)).toContain('weakSignal');
  });

  it('lowers confidence when adapter capabilities are unknown', () => {
    const result = evaluateCompatibility(bss(), {
      ...AX_160,
      bands: [],
      phy: [],
      maxWidthMhz: null,
      security: [],
      source: 'unknown',
    });
    expect(result.confidence).not.toBe('high');
    expect(result.findings.map((finding) => finding.id)).toContain('unknownAdapter');
  });

  it('flags 40 MHz on 2.4 GHz as a router-side finding', () => {
    const result = evaluateCompatibility(bss({ band: 2.4, channel: 6, widthMhz: 40 }), AX_160);
    const finding = result.findings.find((item) => item.id === 'width40On24');
    expect(finding?.side).toBe('router');
  });
});
