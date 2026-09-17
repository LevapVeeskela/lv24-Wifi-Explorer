import assert from 'node:assert/strict';
import test from 'node:test';

import { loadOuiRegistry } from './load-registry.mjs';
import { createOuiRegistry, lookupVendor } from './lookup.mjs';
import { parseIeeeMal } from './parse-ieee-mal.mjs';

const SAMPLE_CSV = `Registry,Assignment,Organization Name,Organization Address
MA-L,00000C,"Cisco Systems, Inc",170 WEST TASMAN DRIVE
MA-L,0017F2,"Apple, Inc.",1 Infinite Loop
MA-L,286FB9,"Nokia Shanghai Bell Co., Ltd.","No.388 Ning Qiao Road,Jin Qiao"
`;

const SAMPLE_TXT = `
  00-00-0C   (hex)		Cisco Systems, Inc
  00000C     (base 16)		Cisco Systems, Inc
				SAN JOSE
`;

function sampleRegistry() {
  return createOuiRegistry(parseIeeeMal(SAMPLE_CSV), {
    fileName: 'oui/ieee-mal.sample.csv',
    generatedAt: '2026-09-17T00:00:00.000Z',
  });
}

test('parseIeeeMal keeps quoted organization commas', () => {
  const map = parseIeeeMal(SAMPLE_CSV);
  assert.equal(map.get('28:6f:b9'), 'Nokia Shanghai Bell Co., Ltd.');
  assert.equal(map.get('00:00:0c'), 'Cisco Systems, Inc');
  assert.equal(map.size, 3);
});

test('parseIeeeMal reads official-style TXT', () => {
  const map = parseIeeeMal(SAMPLE_TXT);
  assert.equal(map.get('00:00:0c'), 'Cisco Systems, Inc');
  assert.equal(map.size, 1);
});

test('no bssid → bssid-redacted', () => {
  const registry = sampleRegistry();
  for (const input of [undefined, null, '', '  ', { status: 'redacted', reason: 'location-required' }]) {
    const view = lookupVendor(input, registry);
    assert.deepEqual(view, {
      oui: null,
      locallyAdministered: false,
      multicast: false,
      organization: null,
      match: 'bssid-redacted',
      registryFile: null,
    });
  }
});

test('U/L bit set → randomized, organization null (even if prefix is in MA-L)', () => {
  const registry = sampleRegistry();
  const view = lookupVendor('02:00:0c:11:22:33', registry);
  assert.equal(view.match, 'randomized');
  assert.equal(view.organization, null);
  assert.equal(view.locallyAdministered, true);
  assert.equal(view.multicast, false);
  assert.equal(view.oui, '02:00:0c');
  assert.equal(view.registryFile, null);
});

test('randomized + multicast notes I/G without a vendor', () => {
  const view = lookupVendor('03:aa:bb:cc:dd:ee', sampleRegistry());
  assert.equal(view.match, 'randomized');
  assert.equal(view.locallyAdministered, true);
  assert.equal(view.multicast, true);
  assert.equal(view.organization, null);
});

test('known MA-L OUI → ieee-mal-24', () => {
  const view = lookupVendor('00:17:F2:aa:bb:cc', sampleRegistry());
  assert.equal(view.match, 'ieee-mal-24');
  assert.equal(view.organization, 'Apple, Inc.');
  assert.equal(view.oui, '00:17:f2');
  assert.equal(view.locallyAdministered, false);
  assert.equal(view.multicast, false);
  assert.equal(view.registryFile, 'oui/ieee-mal.sample.csv');
});

test('I/G multicast bit is noted on a global address', () => {
  const view = lookupVendor('01:00:0c:00:00:01', sampleRegistry());
  assert.equal(view.multicast, true);
  assert.equal(view.locallyAdministered, false);
  assert.equal(view.match, 'unknown');
  assert.equal(view.oui, '01:00:0c');
});

test('MA-L miss → unknown', () => {
  const view = lookupVendor('fc:fc:fc:01:02:03', sampleRegistry());
  assert.equal(view.match, 'unknown');
  assert.equal(view.organization, null);
  assert.equal(view.oui, 'fc:fc:fc');
  assert.equal(view.registryFile, 'oui/ieee-mal.sample.csv');
});

test('dotted / dashed BSSID normalizes', () => {
  const registry = sampleRegistry();
  assert.equal(lookupVendor('0000.0c11.2233', registry).organization, 'Cisco Systems, Inc');
  assert.equal(lookupVendor('00-00-0C-11-22-33', registry).match, 'ieee-mal-24');
});

test('full local IEEE MA-L: randomized vs known OUI', () => {
  const registry = loadOuiRegistry();
  assert.ok(registry.records.size > 8, 'registry should have assignments');
  assert.equal(registry.format, 'ieee-mal-24');

  const apple = lookupVendor('00:17:f2:10:20:30', registry);
  assert.equal(apple.match, 'ieee-mal-24');
  assert.match(apple.organization ?? '', /Apple/i);
  assert.equal(apple.oui, '00:17:f2');
  assert.ok(apple.registryFile?.startsWith('oui/ieee-mal'));

  const randomized = lookupVendor('26:11:22:33:44:55', registry);
  assert.equal(randomized.match, 'randomized');
  assert.equal(randomized.organization, null);
  assert.equal(randomized.locallyAdministered, true);
  assert.equal(randomized.oui, '26:11:22');

  assert.equal(lookupVendor('00:17:f2:10:20:30').organization, apple.organization);
});
