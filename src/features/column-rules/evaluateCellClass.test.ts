import { describe, expect, it } from 'vitest';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import { columnRuleClassesForCell } from './evaluateCellClass';
import type { ColumnRulesConfig } from './types';

function row(partial: Partial<ScanGridRow> & Pick<ScanGridRow, 'signalQuality' | 'securityOpen'>): ScanGridRow {
  return {
    id: 'aa:bb:cc:dd:ee:ff',
    bssid: 'aa:bb:cc:dd:ee:ff',
    ssid: 'Test',
    ssidHidden: false,
    vendor: null,
    annotation: '',
    signalBarPct: 50,
    rssiDbm: -65,
    noiseDbm: null,
    snrDb: null,
    channel: 36,
    channelWidth: 80,
    band: 5,
    phyMode: 'ac',
    securityLabel: 'open',
    networkType: 'infrastructure',
    lastSeenAt: new Date().toISOString(),
    seriesColor: '#fff',
    connected: false,
    stale: false,
    issueKeys: [],
    source: {
      security: { primary: 'open', isOpen: true, label: 'Open' },
    } as ScanGridRow['source'],
    ...partial,
  };
}

const enabledBoth: ColumnRulesConfig = { enabled: true, highlights: ['rssi', 'security'] };

describe('columnRuleClassesForCell', () => {
  it('returns quality class on signal columns when RSSI highlight is on', () => {
    const classes = columnRuleClassesForCell(row({ signalQuality: 'good', securityOpen: false }), 'signal', enabledBoth);
    expect(classes).toContain('scan-grid-cell--quality-good');
  });

  it('returns open security class on security columns', () => {
    const classes = columnRuleClassesForCell(
      row({ signalQuality: 'excellent', securityOpen: true }),
      'securityLock',
      enabledBoth,
    );
    expect(classes).toEqual(['scan-grid-cell--security-open']);
  });

  it('returns weak class for WEP on secure rows', () => {
    const classes = columnRuleClassesForCell(
      row({
        signalQuality: 'fair',
        securityOpen: false,
        source: { security: { primary: 'wep', isOpen: false, label: 'WEP' } } as ScanGridRow['source'],
      }),
      'security',
      enabledBoth,
    );
    expect(classes).toContain('scan-grid-cell--security-weak');
  });

  it('skips unrelated columns', () => {
    const classes = columnRuleClassesForCell(row({ signalQuality: 'poor', securityOpen: true }), 'ssid', enabledBoth);
    expect(classes).toEqual([]);
  });

  it('returns empty when disabled', () => {
    const classes = columnRuleClassesForCell(row({ signalQuality: 'poor', securityOpen: true }), 'signal', {
      enabled: false,
      highlights: ['rssi'],
    });
    expect(classes).toEqual([]);
  });
});
