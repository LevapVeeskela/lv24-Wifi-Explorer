import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { ObservedBss } from '@/domain/bss';
import { bandHasBss, pickOccupancyBand, visibleOccupancyBands } from './bandVisibility';

function mockBss(band: 2.4 | 5 | 6, presence: 'current' | 'disappeared' = 'current'): ObservedBss {
  return {
    channel: { band, number: band === 2.4 ? 6 : band === 5 ? 36 : 5 },
    presence: { presence, missCount: presence === 'disappeared' ? 3 : 0 },
  } as unknown as ObservedBss;
}

describe('visibleOccupancyBands', () => {
  it('keeps all bands when hideEmpty is off', () => {
    assert.deepEqual(visibleOccupancyBands([], false), [2.4, 5, 6]);
  });

  it('drops bands with no live BSS when hideEmpty is on', () => {
    const list = [mockBss(5), mockBss(6)];
    assert.deepEqual(visibleOccupancyBands(list, true), [5, 6]);
    assert.equal(bandHasBss(list, 2.4), false);
    assert.equal(bandHasBss(list, 5), true);
  });

  it('ignores disappeared BSS for emptiness', () => {
    const list = [mockBss(6, 'disappeared')];
    assert.equal(bandHasBss(list, 6), false);
    assert.deepEqual(visibleOccupancyBands(list, true), []);
  });
});

describe('pickOccupancyBand', () => {
  it('prefers visible selection then first visible then fallback', () => {
    assert.equal(pickOccupancyBand(6, [5, 6], 2.4), 6);
    assert.equal(pickOccupancyBand(2.4, [5, 6], 2.4), 5);
    assert.equal(pickOccupancyBand(null, [], 2.4), 2.4);
  });
});
