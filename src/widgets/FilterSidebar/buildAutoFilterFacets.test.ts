import { describe, expect, it } from 'vitest';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import { buildAutoFilterFacets, vendorQueryMatchesLabel } from './buildAutoFilterFacets';

function row(partial: Partial<ScanGridRow>): ScanGridRow {
  return {
    id: 'aa:bb:cc:dd:ee:ff',
    bssid: 'AA:BB:CC:DD:EE:FF',
    ssid: 'Net',
    ssidHidden: false,
    vendor: 'Acme Corp',
    annotation: '',
    signalQuality: 'good',
    signalBarPct: 50,
    rssiDbm: -60,
    noiseDbm: null,
    snrDb: null,
    channel: 1,
    channelWidth: 20,
    band: 2.4,
    phyMode: 'n',
    securityLabel: 'WPA2',
    securityOpen: false,
    networkType: 'infrastructure',
    lastSeenAt: '2026-01-01T00:00:00.000Z',
    seriesColor: '#000',
    connected: false,
    stale: false,
    issueKeys: [],
    source: {} as ScanGridRow['source'],
    ...partial,
  };
}

describe('buildAutoFilterFacets', () => {
  it('aggregates band, security, and vendor counts', () => {
    const facets = buildAutoFilterFacets([
      row({ band: 2.4, securityOpen: true, vendor: 'Acme Corp' }),
      row({ id: '11', bssid: '11:11:11:11:11:11', band: 5, vendor: 'Acme Corp' }),
      row({ id: '22', bssid: '22:22:22:22:22:22', band: 5, vendor: 'Other LLC', securityOpen: true }),
    ]);

    expect(facets.bands).toEqual([
      { id: '24', count: 1 },
      { id: '5', count: 2 },
    ]);
    expect(facets.security).toEqual([
      { id: 'open', count: 2 },
      { id: 'secure', count: 1 },
    ]);
    expect(facets.vendors[0]).toEqual({ label: 'Acme Corp', count: 2 });
  });
});

describe('vendorQueryMatchesLabel', () => {
  it('matches case-insensitively', () => {
    expect(vendorQueryMatchesLabel('Acme Corp', 'Acme Corp')).toBe(true);
    expect(vendorQueryMatchesLabel('acme corp', 'Acme Corp')).toBe(true);
    expect(vendorQueryMatchesLabel('other', 'Acme Corp')).toBe(false);
  });
});
