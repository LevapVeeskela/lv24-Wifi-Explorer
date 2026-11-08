import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { buildIeDiff, IE_DIFF_SHORT_HEX_BYTES } from './buildIeDiff';

/** TLV: element id + length + payload. */
function ie(id: number, payload: readonly number[]): number[] {
  return [id, payload.length, ...payload];
}

describe('buildIeDiff', () => {
  it('marks byte-identical elements as identical', () => {
    const bytes = [...ie(0, [0x41, 0x42]), ...ie(3, [0x06])];

    const diff = buildIeDiff({ bytes }, { bytes: [...bytes] });

    assert.equal(diff.hasData, true);
    assert.equal(diff.comparedCount, 2);
    assert.equal(diff.differingCount, 0);
    assert.deepEqual(
      diff.entries.map((entry) => ({
        name: entry.name,
        differs: entry.differs,
        onlyIn: entry.onlyIn,
      })),
      [
        { name: 'SSID (0)', differs: false, onlyIn: null },
        { name: 'DS Parameter Set (3)', differs: false, onlyIn: null },
      ]
    );
    assert.deepEqual(diff.entries[0]?.left, { length: 2, hex: '4142' });
    assert.deepEqual(diff.entries[0]?.right, { length: 2, hex: '4142' });
  });

  it('marks same-id elements with different payloads as differing', () => {
    const diff = buildIeDiff({ bytes: ie(0, [0x41]) }, { bytes: ie(0, [0x42, 0x43]) });

    assert.equal(diff.comparedCount, 1);
    assert.equal(diff.differingCount, 1);
    const entry = diff.entries[0];
    assert.equal(entry?.differs, true);
    assert.equal(entry?.onlyIn, null);
    assert.deepEqual(entry?.left, { length: 1, hex: '41' });
    assert.deepEqual(entry?.right, { length: 2, hex: '4243' });
  });

  it('reports elements present on one side only', () => {
    const shared = ie(3, [0x01]);
    const diff = buildIeDiff(
      { bytes: [...shared, ...ie(48, [0x01, 0x00])] },
      { bytes: [...shared, ...ie(221, [0x00, 0x50, 0xf2, 0x01])] }
    );

    assert.equal(diff.comparedCount, 3);
    assert.equal(diff.differingCount, 2);
    const byName = new Map(diff.entries.map((entry) => [entry.name, entry]));
    assert.equal(byName.get('RSN (48)')?.onlyIn, 'left');
    assert.equal(byName.get('RSN (48)')?.right, null);
    assert.equal(byName.get('Vendor Specific (221)')?.onlyIn, 'right');
    assert.equal(byName.get('Vendor Specific (221)')?.left, null);
    assert.equal(byName.get('DS Parameter Set (3)')?.differs, false);
  });

  it('aligns repeated ids by occurrence', () => {
    const diff = buildIeDiff(
      { bytes: [...ie(221, [0x00, 0x50, 0xf2, 0x01]), ...ie(221, [0x00, 0x50, 0xf2, 0x02])] },
      { bytes: [...ie(221, [0x00, 0x50, 0xf2, 0x01]), ...ie(221, [0x00, 0x50, 0xf2, 0x03])] }
    );

    assert.equal(diff.comparedCount, 2);
    assert.deepEqual(
      diff.entries.map((entry) => entry.differs),
      [false, true]
    );
    assert.equal(diff.entries[0]?.key, '221::0');
    assert.equal(diff.entries[1]?.key, '221::1');
  });

  it('reports no data when neither side carries IE bytes', () => {
    const diff = buildIeDiff({ bytes: null }, { bytes: [] });

    assert.equal(diff.hasData, false);
    assert.equal(diff.comparedCount, 0);
    assert.deepEqual(diff.entries, []);
  });

  it('still diffs when only one side carries IE bytes', () => {
    const diff = buildIeDiff({ bytes: null }, { bytes: ie(1, [0x82, 0x84]) });

    assert.equal(diff.hasData, true);
    assert.equal(diff.entries[0]?.onlyIn, 'right');
    assert.equal(diff.entries[0]?.left, null);
    assert.deepEqual(diff.entries[0]?.right, { length: 2, hex: '8284' });
  });

  it('truncates long payload hex', () => {
    const payload = Array.from({ length: IE_DIFF_SHORT_HEX_BYTES + 4 }, (_, i) => i + 1);
    const diff = buildIeDiff({ bytes: ie(45, payload) }, { bytes: ie(45, payload) });

    const entry = diff.entries[0];
    assert.equal(entry?.left?.length, IE_DIFF_SHORT_HEX_BYTES + 4);
    assert.equal(entry?.left?.hex.endsWith('…'), true);
    assert.equal(entry?.left?.hex.length, IE_DIFF_SHORT_HEX_BYTES * 2 + 1);
  });
});
