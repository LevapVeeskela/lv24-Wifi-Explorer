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

  it('uses visible utf8 for non-hidden rows', () => {
    const bss = makeObservedBss({ ssid: 'LV24-Campus' });
    const row = observedBssToGridRow(bss, {});
    expect(row?.ssidHidden).toBe(false);
    expect(row?.ssid).toBe('LV24-Campus');
    expect(ssidGridLabel(row!, '‹скрытая›')).toBe('LV24-Campus');
  });
});
