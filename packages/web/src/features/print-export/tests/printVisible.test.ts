import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { ScanGridRow } from '@/entities/bss';
import { buildPrintHtml } from '../buildPrintHtml';
import { resolvePrintColumns } from '../resolvePrintColumns';

function row(partial: Partial<ScanGridRow> & Pick<ScanGridRow, 'bssid'>): ScanGridRow {
  return {
    id: partial.id ?? partial.bssid,
    ssid: partial.ssid ?? 'Test',
    ssidHidden: partial.ssidHidden ?? false,
    vendor: partial.vendor ?? null,
    annotation: partial.annotation ?? '',
    signalQuality: partial.signalQuality ?? 'good',
    signalBarPct: partial.signalBarPct ?? 70,
    rssiDbm: partial.rssiDbm ?? -55,
    noiseDbm: partial.noiseDbm ?? null,
    snrDb: partial.snrDb ?? null,
    channel: partial.channel ?? 36,
    channelWidth: partial.channelWidth ?? 80,
    band: partial.band ?? 5,
    phyMode: partial.phyMode ?? '802.11ac',
    securityLabel: partial.securityLabel ?? 'wpa2',
    securityOpen: partial.securityOpen ?? false,
    networkType: partial.networkType ?? 'infrastructure',
    lastSeenAt: partial.lastSeenAt ?? new Date().toISOString(),
    seriesColor: partial.seriesColor ?? '#336699',
    connected: partial.connected ?? false,
    stale: partial.stale ?? false,
    issueKeys: partial.issueKeys ?? [],
    source: partial.source ?? ({} as ScanGridRow['source']),
    bssid: partial.bssid,
  };
}

describe('resolvePrintColumns', () => {
  it('drops decorative columns and keeps data fields', () => {
    const columns = resolvePrintColumns(
      ['seriesColor', 'bssid', 'ssid', 'securityLock', 'channel'],
      (id) => id
    );
    assert.deepEqual(
      columns.map((c) => c.id),
      ['bssid', 'ssid', 'channel']
    );
  });
});

describe('buildPrintHtml', () => {
  it('embeds row values and escapes markup', () => {
    const result = buildPrintHtml({
      productTitle: 'LV24 WiFi Explorer',
      rows: [row({ bssid: 'aa:bb:cc:00:00:01', ssid: '<Campus>' })],
      columns: [
        { id: 'bssid', label: 'BSSID' },
        { id: 'ssid', label: 'SSID' },
      ],
      signalUnit: 'percent',
      hiddenSsidLabel: '(hidden)',
      networkTypeLabels: { ibss: 'Ad-hoc', infrastructure: 'Infrastructure' },
      formatIssueKey: (key) => key,
      printedAt: new Date('2026-01-15T12:00:00.000Z'),
    });

    assert.equal(result.rowCount, 1);
    assert.match(result.html, /aa:bb:cc:00:00:01/);
    assert.match(result.html, /&lt;Campus&gt;/);
    assert.doesNotMatch(result.html, /<Campus>/);
  });
});
