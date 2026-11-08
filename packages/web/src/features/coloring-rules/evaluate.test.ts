import { describe, expect, it } from 'vitest';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import {
  evaluateColoringRule,
  resolveColoringColor,
  resolveColoringColorFromStore,
} from './evaluate';
import type { ColoringRule } from './types';

function row(partial: Partial<ScanGridRow> = {}): ScanGridRow {
  return {
    id: 'a8:9d:21:74:24:3e',
    bssid: 'a8:9d:21:74:24:3e',
    ssid: 'Home 5G',
    ssidHidden: false,
    vendor: 'Ubiquiti Inc.',
    annotation: '',
    signalQuality: 'good',
    signalBarPct: 60,
    rssiDbm: -65,
    noiseDbm: null,
    snrDb: null,
    channel: 36,
    channelWidth: 80,
    band: 5,
    phyMode: 'ax',
    securityLabel: 'wpa3',
    securityOpen: false,
    networkType: 'infrastructure',
    lastSeenAt: new Date().toISOString(),
    seriesColor: '#fff',
    connected: false,
    stale: false,
    issueKeys: [],
    source: {} as ScanGridRow['source'],
    ...partial,
  };
}

function rule(partial: Partial<ColoringRule> = {}): ColoringRule {
  return {
    id: partial.id ?? 'r1',
    name: 'rule',
    enabled: true,
    priority: 0,
    color: '#ff0000',
    field: 'ssid',
    op: 'contains',
    value: 'home',
    ...partial,
  };
}

describe('evaluateColoringRule — text fields', () => {
  it('matches ssid case-insensitively', () => {
    expect(evaluateColoringRule(row(), rule({ value: 'HOME' }))).toBe(true);
    expect(evaluateColoringRule(row(), rule({ value: 'office' }))).toBe(false);
  });

  it('supports equals and glob on text', () => {
    expect(evaluateColoringRule(row(), rule({ op: 'equals', value: 'Home 5G' }))).toBe(true);
    expect(evaluateColoringRule(row(), rule({ op: 'equals', value: 'Home*' }))).toBe(true);
    expect(evaluateColoringRule(row(), rule({ op: 'equals', value: 'Home?' }))).toBe(false);
  });

  it('matches vendor and security labels', () => {
    expect(
      evaluateColoringRule(row(), rule({ field: 'vendor', value: 'ubiquiti', op: 'contains' }))
    ).toBe(true);
    expect(
      evaluateColoringRule(row(), rule({ field: 'security', value: 'wpa3', op: 'equals' }))
    ).toBe(true);
  });

  it('treats a null vendor as an empty string', () => {
    const target = row({ vendor: null });
    expect(evaluateColoringRule(target, rule({ field: 'vendor', op: 'equals', value: '' }))).toBe(
      true
    );
  });

  it('matches any of a row issues', () => {
    const target = row({ issueKeys: ['scan.issue.separateNames'] });
    expect(
      evaluateColoringRule(target, rule({ field: 'issue', op: 'contains', value: 'separateNames' }))
    ).toBe(true);
    expect(
      evaluateColoringRule(row(), rule({ field: 'issue', op: 'contains', value: 'any' }))
    ).toBe(false);
  });
});

describe('evaluateColoringRule — bssid wildcards', () => {
  it('matches prefix wildcard ignoring separators and case', () => {
    expect(
      evaluateColoringRule(row(), rule({ field: 'bssid', op: 'equals', value: 'A8:9D:21:*' }))
    ).toBe(true);
    expect(
      evaluateColoringRule(row(), rule({ field: 'bssid', op: 'equals', value: 'a89d21*' }))
    ).toBe(true);
  });

  it('supports single-character wildcard', () => {
    expect(
      evaluateColoringRule(
        row(),
        rule({ field: 'bssid', op: 'equals', value: 'a8:9d:21:74:24:3?' })
      )
    ).toBe(true);
    expect(
      evaluateColoringRule(
        row(),
        rule({ field: 'bssid', op: 'equals', value: 'a8:9d:21:74:24:???' })
      )
    ).toBe(false);
  });

  it('matches exact bssid and contains fragments', () => {
    expect(
      evaluateColoringRule(
        row(),
        rule({ field: 'bssid', op: 'equals', value: 'a8-9d-21-74-24-3e' })
      )
    ).toBe(true);
    expect(
      evaluateColoringRule(row(), rule({ field: 'bssid', op: 'contains', value: '21:74' }))
    ).toBe(true);
    expect(
      evaluateColoringRule(row(), rule({ field: 'bssid', op: 'contains', value: 'ff:ff' }))
    ).toBe(false);
  });

  it('rejects ordering ops on bssid', () => {
    expect(
      evaluateColoringRule(row(), rule({ field: 'bssid', op: 'gt', value: 'a8:9d:21:00:00:00' }))
    ).toBe(false);
  });
});

describe('evaluateColoringRule — numeric and band fields', () => {
  it('compares rssi numerically', () => {
    expect(evaluateColoringRule(row(), rule({ field: 'rssi', op: 'lt', value: '-70' }))).toBe(
      false
    );
    expect(evaluateColoringRule(row(), rule({ field: 'rssi', op: 'lte', value: '-65' }))).toBe(
      true
    );
    expect(evaluateColoringRule(row(), rule({ field: 'rssi', op: 'gte', value: '-70' }))).toBe(
      true
    );
    expect(evaluateColoringRule(row(), rule({ field: 'rssi', op: 'gt', value: '-65' }))).toBe(
      false
    );
  });

  it('compares channels with numeric, not lexicographic, order', () => {
    expect(
      evaluateColoringRule(row({ channel: 6 }), rule({ field: 'channel', op: 'lt', value: '36' }))
    ).toBe(true);
    expect(
      evaluateColoringRule(row({ channel: 149 }), rule({ field: 'channel', op: 'gt', value: '36' }))
    ).toBe(true);
  });

  it('accepts band values with and without the ghz suffix', () => {
    for (const value of ['5', '5ghz', '5 GHz']) {
      expect(
        evaluateColoringRule(row({ band: 5 }), rule({ field: 'band', op: 'equals', value }))
      ).toBe(true);
    }
    expect(
      evaluateColoringRule(
        row({ band: 2.4 }),
        rule({ field: 'band', op: 'equals', value: '2.4ghz' })
      )
    ).toBe(true);
    expect(
      evaluateColoringRule(row({ band: 6 }), rule({ field: 'band', op: 'equals', value: '5' }))
    ).toBe(false);
  });

  it('matches the unknown band by text', () => {
    const target = row({ band: 'unknown' });
    expect(
      evaluateColoringRule(target, rule({ field: 'band', op: 'equals', value: 'unknown' }))
    ).toBe(true);
    expect(evaluateColoringRule(target, rule({ field: 'band', op: 'gte', value: '5' }))).toBe(
      false
    );
  });

  it('returns false for non-numeric ordering operands', () => {
    expect(evaluateColoringRule(row(), rule({ field: 'rssi', op: 'gt', value: 'strong' }))).toBe(
      false
    );
  });

  it('matches phy mode exactly', () => {
    expect(evaluateColoringRule(row(), rule({ field: 'phy', op: 'equals', value: 'AX' }))).toBe(
      true
    );
  });
});

describe('resolveColoringColor', () => {
  it('returns null when nothing matches', () => {
    expect(resolveColoringColor(row(), [rule({ value: 'office' })])).toBeNull();
  });

  it('first match by priority wins', () => {
    const rules = [
      rule({ id: 'low', priority: 10, color: '#0000ff', value: 'home' }),
      rule({ id: 'high', priority: 1, color: '#ff0000', value: 'home' }),
    ];
    expect(resolveColoringColor(row(), rules)).toBe('#ff0000');
  });

  it('skips disabled rules', () => {
    const rules = [
      rule({ id: 'off', priority: 0, color: '#ff0000', enabled: false }),
      rule({ id: 'on', priority: 5, color: '#00ff00' }),
    ];
    expect(resolveColoringColor(row(), rules)).toBe('#00ff00');
  });

  it('falls back to array order for duplicate priorities', () => {
    const rules = [
      rule({ id: 'a', priority: 0, color: '#111111' }),
      rule({ id: 'b', priority: 0, color: '#222222' }),
    ];
    expect(resolveColoringColor(row(), rules)).toBe('#111111');
  });

  it('honors the store-level enabled flag', () => {
    const rules = [rule()];
    expect(resolveColoringColorFromStore(row(), { enabled: true, rules })).toBe('#ff0000');
    expect(resolveColoringColorFromStore(row(), { enabled: false, rules })).toBeNull();
  });
});
