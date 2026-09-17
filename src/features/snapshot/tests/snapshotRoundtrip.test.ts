import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  LV24_SCAN_APP_NAME,
  LV24_SCAN_EXTENSION,
  LV24_SCAN_KIND,
} from '../constants';
import { createLv24ScanDocument } from '../createDocument';
import { isForeignScanFileName, isLv24ScanFileName, suggestLv24ScanFileName } from '../fileName';
import { parseLv24Scan } from '../parse';
import { serializeLv24Scan } from '../serialize';
import { fixtureBss } from './fixtureBss';

describe('lv24scan file names', () => {
  it('accepts .lv24scan and rejects third-party extensions', () => {
    assert.equal(isLv24ScanFileName('campus.lv24scan'), true);
    assert.equal(isLv24ScanFileName('/tmp/campus.LV24SCAN'), true);
    assert.equal(isLv24ScanFileName('campus.wifiexplorer'), false);
    assert.equal(isForeignScanFileName('old.wifiexplorer'), true);
    assert.ok(suggestLv24ScanFileName('2026-09-17T19:00:00.000Z').endsWith(LV24_SCAN_EXTENSION));
  });
});

describe('lv24scan roundtrip', () => {
  it('serialize → parse preserves networks, history, annotations, colors, metadata', () => {
    const bss = fixtureBss('aa:bb:cc:00:00:01', 'LV24-Campus');
    const original = createLv24ScanDocument({
      networks: [bss],
      annotations: [{ id: 'n1', bssidPattern: 'aa:bb:cc:*', text: 'lab' }],
      pinnedColors: [{ bssid: 'aa:bb:cc:00:00:01', color: '#4c8bf5' }],
      appVersion: '0.1.0',
      os: 'darwin 27.0.0',
      capturedAt: '2026-09-17T19:00:00.000Z',
      interfaceName: 'en0',
      scanIntervalMs: 3000,
      location: 'granted',
    });

    const text = serializeLv24Scan(original);
    assert.ok(text.includes(LV24_SCAN_KIND));
    assert.ok(text.includes(LV24_SCAN_APP_NAME));
    assert.ok(!text.toLowerCase().includes('wifiexplorer'));

    const parsed = parseLv24Scan(text, 'campus.lv24scan');
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;

    const doc = parsed.document;
    assert.equal(doc.kind, original.kind);
    assert.equal(doc.formatVersion, original.formatVersion);
    assert.equal(doc.metadata.appName, LV24_SCAN_APP_NAME);
    assert.equal(doc.metadata.appVersion, '0.1.0');
    assert.equal(doc.metadata.os, 'darwin 27.0.0');
    assert.equal(doc.metadata.scanIntervalMs, 3000);
    assert.equal(doc.networks.length, 1);
    assert.equal(doc.networks[0].identity.bssid.status, 'available');
    if (doc.networks[0].identity.bssid.status === 'available') {
      assert.equal(doc.networks[0].identity.bssid.value, 'aa:bb:cc:00:00:01');
    }
    assert.equal(doc.networks[0].rssiHistory.length, 2);
    assert.equal(doc.networks[0].rssiHistory[1].rssiDbm, -57);
    assert.equal(doc.historyById['aa:bb:cc:00:00:01']?.length, 2);
    assert.deepEqual(doc.annotations, original.annotations);
    assert.deepEqual(doc.pinnedColors, original.pinnedColors);
    assert.equal(doc.networks[0].signal.snrDb, 37);
  });

  it('rejects competitor file names and documents', () => {
    const foreignName = parseLv24Scan('{"kind":"lv24.wifi-explorer.scan"}', 'x.wifiexplorer');
    assert.equal(foreignName.ok, false);
    if (!foreignName.ok) assert.equal(foreignName.code, 'foreign-format');

    const foreignBody = parseLv24Scan('{"kind":"wifiexplorer","networks":[]}');
    assert.equal(foreignBody.ok, false);
    if (!foreignBody.ok) assert.equal(foreignBody.code, 'foreign-format');
  });

  it('rejects invalid JSON', () => {
    const r = parseLv24Scan('{not json');
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.code, 'invalid-json');
  });
});
