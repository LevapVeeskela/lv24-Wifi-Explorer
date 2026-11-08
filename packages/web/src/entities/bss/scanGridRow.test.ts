import { describe, expect, it } from 'vitest';
import { makeObservedBss } from '@/domain/testSupport';
import { observedBssToGridRow, ssidGridLabel, ssidHiddenFromBss } from './scanGridRow';

describe('scanGridRow SSID grid cues', () => {
  it('marks empty octets as hidden', () => {
    const bss = makeObservedBss({ hidden: true, ssid: '' });
    expect(ssidHiddenFromBss(bss)).toBe(true);
    const row = observedBssToGridRow(bss, {});
    expect(row?.ssidHidden).toBe(true);
    expect(row?.ssid).toBe('');
    expect(ssidGridLabel(row!, '‹скрытая›')).toBe('‹скрытая›');
  });

  it('keeps RF-only rows when Location redacts BSSID/SSID', () => {
    const bss = makeObservedBss({ bssid: null });
    const row = observedBssToGridRow(bss, {});
    expect(row).not.toBeNull();
    expect(row?.bssid).toBe('—');
    expect(row?.id.startsWith('anon:')).toBe(true);
  });

  it('derives honest extended columns from existing scan data', () => {
    const capturedAt = '2026-09-17T19:00:00.000Z';
    const bss = makeObservedBss({
      ssid: 'LV24-Campus',
      firstSeenAt: '2026-09-17T18:58:00.000Z',
      capturedAt,
    });
    bss.ie.level = 'shallow-tags';
    bss.ie.dtimPeriod = 3;
    bss.ie.bssLoadStations = 12;
    bss.ie.bssLoadUtilPct = 44;
    bss.ie.wps = true;
    bss.ie.wpsDeviceName = 'LV24-AP-7F';
    bss.ie.mfpRequired = true;
    bss.ie.mobilityDomain = true;
    bss.ie.nssHint = 2;
    const row = observedBssToGridRow(bss, { now: Date.parse(capturedAt) });
    expect(row?.uptimeSec).toBe(120);
    expect(row?.generation).toBe('Wi-Fi 4');
    expect(row?.amendments).toEqual(['n']);
    expect(row?.streams).toBe(2);
    expect(row?.beaconIntervalMs).toBe(100);
    expect(row?.dtimPeriod).toBe(3);
    expect(row?.bssLoadStations).toBe(12);
    expect(row?.bssLoadUtilPct).toBe(44);
    expect(row?.wps).toBe(true);
    expect(row?.apName).toBe('LV24-AP-7F');
    expect(row?.mfp).toBe(true);
    expect(row?.ft).toBe(true);
  });

  it('uses visible utf8 for non-hidden rows', () => {
    const bss = makeObservedBss({ ssid: 'LV24-Campus' });
    const row = observedBssToGridRow(bss, {});
    expect(row?.ssidHidden).toBe(false);
    expect(row?.ssid).toBe('LV24-Campus');
    expect(ssidGridLabel(row!, '‹скрытая›')).toBe('LV24-Campus');
  });
});

describe('scanGridRow apName', () => {
  it('takes the WPS device name only — no vendor or SSID invention', () => {
    const bss = makeObservedBss({ ssid: 'LV24-Campus' });
    bss.ie.level = 'shallow-tags';
    bss.ie.wps = true;
    bss.ie.wpsDeviceName = 'Hall-AP-3';
    expect(observedBssToGridRow(bss, {})?.apName).toBe('Hall-AP-3');
  });

  it('is null without parsed WPS bytes', () => {
    const bss = makeObservedBss({ ssid: 'LV24-Campus' });
    expect(observedBssToGridRow(bss, {})?.apName).toBeNull();

    bss.ie.level = 'shallow-tags';
    bss.ie.wps = true;
    bss.ie.wpsDeviceName = null;
    expect(observedBssToGridRow(bss, {})?.apName).toBeNull();
  });
});
