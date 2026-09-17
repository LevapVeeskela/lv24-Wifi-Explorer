import { describe, expect, it } from 'vitest';
import { SCAN_FILTER_DEFAULTS, applyScanFilter } from './filters';
import { makeObservedBss } from './testSupport';

const rows = [
  makeObservedBss({
    bssid: '00:11:22:0e:00:01',
    ssid: 'Cafe-Free',
    band: 2.4,
    channel: 11,
    rssiDbm: -55,
    security: 'open',
    vendorOrganization: 'Acme',
  }),
  makeObservedBss({
    bssid: '00:11:22:0e:00:02',
    ssid: 'Campus',
    band: 5,
    channel: 36,
    rssiDbm: -70,
    security: 'secure',
    vendorOrganization: 'Acme',
  }),
  makeObservedBss({
    bssid: '02:11:22:aa:bb:cc',
    ssid: 'PhoneHotspot',
    band: 2.4,
    channel: 6,
    rssiDbm: -40,
    security: 'secure',
    vendorOrganization: 'ShouldNotMatch',
  }),
];

describe('applyScanFilter', () => {
  it('filters by band, open/secure, ssid, bssid, vendor, minRssi', () => {
    const only24 = applyScanFilter(rows, { ...SCAN_FILTER_DEFAULTS, bands: [2.4] });
    expect(only24.every((row) => row.channel.band === 2.4)).toBe(true);
    expect(only24).toHaveLength(2);

    const open = applyScanFilter(rows, { ...SCAN_FILTER_DEFAULTS, security: 'open' });
    expect(open).toHaveLength(1);
    expect(open[0]?.security.isOpen).toBe(true);

    const secure = applyScanFilter(rows, { ...SCAN_FILTER_DEFAULTS, security: 'secure' });
    expect(secure.every((row) => row.security.isSecure)).toBe(true);
    expect(secure).toHaveLength(2);

    const ssid = applyScanFilter(rows, { ...SCAN_FILTER_DEFAULTS, ssidQuery: 'campus' });
    expect(ssid).toHaveLength(1);

    const bssid = applyScanFilter(rows, { ...SCAN_FILTER_DEFAULTS, ssidQuery: '0e:00:01' });
    expect(bssid).toHaveLength(1);
    expect(bssid[0]?.lastRaw.bssid).toBe('00:11:22:0e:00:01');

    const vendorOui = applyScanFilter(rows, { ...SCAN_FILTER_DEFAULTS, vendorQuery: '02:11:22' });
    expect(vendorOui).toHaveLength(1);
    const vendorName = applyScanFilter(rows, { ...SCAN_FILTER_DEFAULTS, vendorQuery: 'ShouldNotMatch' });
    expect(vendorName).toHaveLength(0);
    const acme = applyScanFilter(rows, { ...SCAN_FILTER_DEFAULTS, vendorQuery: 'acme' });
    expect(acme).toHaveLength(2);

    const strong = applyScanFilter(rows, { ...SCAN_FILTER_DEFAULTS, minRssiDbm: -50 });
    expect(strong.every((row) => row.signal.rssiDbm >= -50)).toBe(true);
    expect(strong).toHaveLength(1);
  });
});
