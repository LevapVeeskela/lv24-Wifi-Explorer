import { describe, expect, it } from 'vitest';
import { makeObservedBss } from '@/domain/testSupport';
import { observedBssToGridRow } from '@/entities/bss/scanGridRow';
import { applyAllFilters } from './applyAllFilters';
import { FILTER_DEFAULTS } from './types';

describe('applyAllFilters includeHiddenSsid', () => {
  it('drops hidden SSID rows when includeHiddenSsid is false', () => {
    const visible = observedBssToGridRow(makeObservedBss({ ssid: 'LV24-Campus' }), {})!;
    const hidden = observedBssToGridRow(makeObservedBss({ hidden: true, ssid: '' }), {})!;
    const out = applyAllFilters([visible, hidden], {
      ...FILTER_DEFAULTS,
      includeHiddenSsid: false,
    });
    expect(out.map((row) => row.bssid)).toEqual([visible.bssid]);
  });

  it('keeps hidden SSID rows when includeHiddenSsid is true', () => {
    const hidden = observedBssToGridRow(makeObservedBss({ hidden: true, ssid: '' }), {})!;
    const out = applyAllFilters([hidden], {
      ...FILTER_DEFAULTS,
      includeHiddenSsid: true,
    });
    expect(out).toHaveLength(1);
  });
});
