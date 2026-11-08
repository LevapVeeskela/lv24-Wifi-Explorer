import { describe, expect, it } from 'vitest';
import { createFormatMessage } from '@/shared/i18n';
import { buildScanGridColumns } from './index';

/** Order published to the workbench column catalog; must never change silently. */
const EXPECTED_FIELDS = [
  'seriesColor',
  'bssid',
  'ssid',
  'securityLock',
  'vendor',
  'apName',
  'annotation',
  'issueFlags',
  'signal',
  'signalTrend',
  'channel',
  'channelWidth',
  'band',
  'phyMode',
  'security',
  'rssiDbm',
  'noiseDbm',
  'snrDb',
  'lastSeenAt',
  'unii',
  'firstSeenAt',
  'uptimeSec',
  'centerFreqMhz',
  'maxRateMbps',
  'streams',
  'amendments',
  'generation',
  'countryCode',
  'beaconIntervalMs',
  'dtimPeriod',
  'bssLoadStations',
  'bssLoadUtilPct',
  'channelUtilPct',
  'ieCount',
  'ieBytes',
  'wps',
  'mfp',
  'ft',
  'networkType',
];

describe('buildScanGridColumns', () => {
  it('keeps the published column order', () => {
    const columns = buildScanGridColumns({
      formatMessage: createFormatMessage('en'),
      signalUnit: 'percent',
    });

    expect(columns.map((column) => column.field)).toEqual(EXPECTED_FIELDS);
  });

  it('declares a label for every column', () => {
    const columns = buildScanGridColumns({
      formatMessage: createFormatMessage('en'),
      signalUnit: 'percent',
    });

    expect(
      columns.filter((column) => column.headerName === undefined).map((column) => column.field)
    ).toEqual([]);
  });
});
