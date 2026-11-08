import { describe, expect, it } from 'vitest';
import { evaluateIssues } from './evaluate';
import { SCAN_ISSUE_THRESHOLDS } from './thresholds';
import type { ScanIssueBss } from './types';

function baseBss(overrides: Partial<ScanIssueBss> = {}): ScanIssueBss {
  return {
    channel: { band: 2.4, number: 6, widthMhz: 20 },
    signal: { rssiDbm: -55, snrDb: 40 },
    security: { primary: 'wpa2-personal', isOpen: false },
    hiddenSsid: false,
    phy: { highest: 'ac', supported: ['n', 'ac'] },
    ...overrides,
  };
}

function ids(bss: ScanIssueBss, neighbors: readonly ScanIssueBss[] = []) {
  return evaluateIssues(bss, neighbors).map((f) => f.id);
}

describe('evaluateIssues', () => {
  it('flags width40on24 when 2.4 GHz width is at least 40 MHz', () => {
    expect(ids(baseBss({ channel: { band: 2.4, number: 6, widthMhz: 40 } }))).toContain(
      'width40on24'
    );
    expect(ids(baseBss({ channel: { band: 5, number: 36, widthMhz: 40 } }))).not.toContain(
      'width40on24'
    );
  });

  it('flags overlap24 for non 1/6/11 on 2.4 GHz', () => {
    expect(ids(baseBss({ channel: { band: 2.4, number: 3, widthMhz: 20 } }))).toContain(
      'overlap24'
    );
    expect(ids(baseBss({ channel: { band: 2.4, number: 6, widthMhz: 20 } }))).not.toContain(
      'overlap24'
    );
  });

  it('skips overlap24 for Japan channel 14', () => {
    const jp = baseBss({
      channel: { band: 2.4, number: 14, widthMhz: 20 },
      countryCode: 'JP',
    });
    expect(ids(jp)).not.toContain('overlap24');
    const nonJp = baseBss({
      channel: { band: 2.4, number: 14, widthMhz: 20 },
      countryCode: 'US',
    });
    expect(ids(nonJp)).toContain('overlap24');
  });

  it('flags crowdedChannel when enough overlapping neighbors', () => {
    const self = baseBss({ channel: { band: 2.4, number: 6, widthMhz: 20 } });
    const neighbors = [
      baseBss({ channel: { band: 2.4, number: 4, widthMhz: 20 } }),
      baseBss({ channel: { band: 2.4, number: 5, widthMhz: 20 } }),
      baseBss({ channel: { band: 2.4, number: 7, widthMhz: 20 } }),
      baseBss({ channel: { band: 2.4, number: 8, widthMhz: 20 } }),
    ];
    expect(ids(self, neighbors)).toContain('crowdedChannel');
    expect(
      evaluateIssues(self, neighbors.slice(0, 3), { crowdedChannelMinNeighbors: 4 }).map(
        (f) => f.id
      )
    ).not.toContain('crowdedChannel');
    expect(
      evaluateIssues(self, neighbors.slice(0, 3), { crowdedChannelMinNeighbors: 3 }).map(
        (f) => f.id
      )
    ).toContain('crowdedChannel');
  });

  it('uses open thresholds for low signal and SNR', () => {
    expect(ids(baseBss({ signal: { rssiDbm: -71, snrDb: 40 } }))).toContain('lowSignal');
    expect(ids(baseBss({ signal: { rssiDbm: -70, snrDb: 40 } }))).not.toContain('lowSignal');
    expect(ids(baseBss({ signal: { rssiDbm: -55, snrDb: 24 } }))).toContain('lowSnr');
    expect(ids(baseBss({ signal: { rssiDbm: -55, snrDb: null } }))).not.toContain('lowSnr');
    expect(SCAN_ISSUE_THRESHOLDS.lowSignalRssiDbm).toBe(-70);
    expect(SCAN_ISSUE_THRESHOLDS.lowSnrDb).toBe(25);
  });

  it('flags weak security for open, WEP, and TKIP-only', () => {
    expect(ids(baseBss({ security: { primary: 'open', isOpen: true } }))).toContain('weakSecurity');
    expect(ids(baseBss({ security: { primary: 'wep', isOpen: false } }))).toContain('weakSecurity');
    expect(ids(baseBss({ tkipOnly: true }))).toContain('weakSecurity');
    expect(ids(baseBss({ security: { primary: 'wpa2-personal', isOpen: false } }))).not.toContain(
      'weakSecurity'
    );
  });

  it('flags hidden SSID and legacy-only PHY', () => {
    expect(ids(baseBss({ hiddenSsid: true }))).toContain('hiddenSsid');
    expect(ids(baseBss({ phy: { highest: 'g', supported: ['b', 'g'] } }))).toContain('legacyOnly');
    expect(ids(baseBss({ phy: { highest: 'n', supported: ['g', 'n'] } }))).not.toContain(
      'legacyOnly'
    );
  });

  it('flags high utilization only when present', () => {
    expect(ids(baseBss({ channelUtilPct: 70 }))).toContain('highUtil');
    expect(ids(baseBss({ channelUtilPct: 69 }))).not.toContain('highUtil');
    expect(ids(baseBss())).not.toContain('highUtil');
  });

  it('marks DFS as info severity', () => {
    const flags = evaluateIssues(baseBss({ channel: { band: 5, number: 52, widthMhz: 20 } }), []);
    const dfs = flags.find((f) => f.id === 'dfs');
    expect(dfs?.severity).toBe('info');
    expect(dfs?.i18nKey).toBe('scan.issue.dfs');
  });
});
