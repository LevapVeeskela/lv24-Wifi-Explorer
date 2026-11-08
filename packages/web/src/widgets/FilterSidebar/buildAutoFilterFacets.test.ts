import { describe, expect, it } from 'vitest';
import { makeObservedBss } from '@/domain/testSupport';
import { observedBssToGridRow } from '@/entities/bss';
import { buildAutoFilterFacets } from './buildAutoFilterFacets';

function row(ssid: string, bssid: string, extra: Record<string, unknown> = {}) {
  return { ...observedBssToGridRow(makeObservedBss({ ssid, bssid }), {})!, ...extra };
}

describe('buildAutoFilterFacets extended', () => {
  it('counts channel, width, phy, type and annotations', () => {
    const a = row('A', '00:11:22:33:44:01', { annotation: 'lab' });
    const b = row('B', '00:11:22:33:44:02');
    const facets = buildAutoFilterFacets([a, b]);
    expect(facets.channels.some((facet) => facet.channel === a.channel)).toBe(true);
    expect(facets.widths.some((facet) => facet.widthMhz === 20)).toBe(true);
    expect(facets.phys.some((facet) => facet.phy === 'n')).toBe(true);
    expect(facets.networkTypes).toEqual([{ id: 'infrastructure', count: 2 }]);
    expect(facets.annotations).toEqual(
      expect.arrayContaining([
        { id: 'annotated', count: 1 },
        { id: 'unannotated', count: 1 },
      ])
    );
  });
});
