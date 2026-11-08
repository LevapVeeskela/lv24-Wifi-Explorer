import { describe, expect, it } from 'vitest';
import { makeObservedBss } from '@/domain/testSupport';
import { observedBssToGridRow } from '@/entities/bss/scanGridRow';
import { filterQueryForCell, showColumnModel } from './cellContextMenu';

const row = observedBssToGridRow(
  makeObservedBss({
    ssid: 'Campus Wi-Fi',
    bssid: '88:1f:a1:31:e6:ee',
    vendorOrganization: 'Acme Corp',
  }),
  {}
)!;

describe('cell context menu helpers', () => {
  it('builds safe keyed/ quoted queries and skips redacted values', () => {
    expect(filterQueryForCell(row, 'ssid')).toBe('"Campus Wi-Fi"');
    expect(filterQueryForCell(row, 'bssid')).toBe('bssid:88:1f:a1:31:e6:ee');
    expect(filterQueryForCell(row, 'vendor')).toBe('vendor:Acme');
    expect(filterQueryForCell(row, 'channel')).toBe(`channel:${row.channel}`);
    expect(filterQueryForCell(row, 'unknown')).toBeNull();
    const hidden = observedBssToGridRow(makeObservedBss({ hidden: true, ssid: '' }), {})!;
    expect(filterQueryForCell(hidden, 'ssid')).toBeNull();
  });

  it('shows a hidden column only once', () => {
    expect(showColumnModel({ vendor: false }, 'vendor')).toEqual({ vendor: true });
    expect(showColumnModel({ vendor: true }, 'vendor')).toBeNull();
  });
});
