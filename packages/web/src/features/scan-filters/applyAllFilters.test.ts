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

  it('keeps rows matching any selected issue id', () => {
    const low = {
      ...observedBssToGridRow(makeObservedBss({ ssid: 'Low', bssid: '00:11:22:33:44:01' }), {})!,
      issueKeys: ['scan.issue.lowSignal' as const],
    };
    const clean = {
      ...observedBssToGridRow(makeObservedBss({ ssid: 'Clean', bssid: '00:11:22:33:44:02' }), {})!,
      issueKeys: [],
    };
    const out = applyAllFilters([low, clean], {
      ...FILTER_DEFAULTS,
      issueIds: ['lowSignal'],
    });
    expect(out.map((row) => row.ssid)).toEqual(['Low']);
  });

  it('applies channel, width, phy, type, annotation and selection facets', () => {
    const a = observedBssToGridRow(
      makeObservedBss({ ssid: 'A', bssid: '00:11:22:33:44:0a', channel: 1 }),
      {}
    )!;
    const b = observedBssToGridRow(
      makeObservedBss({ ssid: 'B', bssid: '00:11:22:33:44:0b', channel: 6 }),
      {}
    )!;
    const annotated = { ...a, annotation: 'lab' };
    expect(
      applyAllFilters([annotated, b], { ...FILTER_DEFAULTS, channel: a.channel })
    ).toHaveLength(1);
    expect(applyAllFilters([annotated, b], { ...FILTER_DEFAULTS, widthMhz: 20 })).toHaveLength(2);
    expect(applyAllFilters([annotated, b], { ...FILTER_DEFAULTS, phy: 'n' })).toHaveLength(2);
    expect(
      applyAllFilters([annotated, b], { ...FILTER_DEFAULTS, networkType: 'ibss' })
    ).toHaveLength(0);
    expect(
      applyAllFilters([annotated, b], { ...FILTER_DEFAULTS, annotatedOnly: true })
    ).toHaveLength(1);
    expect(
      applyAllFilters([annotated, b], { ...FILTER_DEFAULTS, selectedOnly: true }, undefined, {
        selectedIds: new Set([b.id]),
      })
    ).toHaveLength(1);
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
