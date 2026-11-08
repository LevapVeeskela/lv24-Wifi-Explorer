import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { buildCsv, encodeCsvUtf8 } from '../buildCsv';
import { resolveCsvHeaders, selectCsvRows } from '../resolveCsv';
import type { CsvExportRow } from '../types';

const rows: CsvExportRow[] = [
  {
    id: 'aa:bb:cc:00:00:01',
    bssid: 'aa:bb:cc:00:00:01',
    ssid: 'Campus',
    rssiDbm: -50,
    annotation: 'ядро',
  },
  {
    id: 'aa:bb:cc:00:00:02',
    bssid: 'aa:bb:cc:00:00:02',
    ssid: 'Lab, "A"',
    rssiDbm: -70,
    annotation: '',
  },
  {
    id: 'aa:bb:cc:00:00:03',
    bssid: 'aa:bb:cc:00:00:03',
    ssid: 'Café ☕',
    rssiDbm: -62,
    annotation: 'гость',
  },
];

const visible = [rows[0], rows[1]];

function request(
  scope: 'visible' | 'selected' | 'all',
  extra: Partial<Parameters<typeof buildCsv>[0]> = {}
) {
  return buildCsv({
    scope,
    allRows: rows,
    visibleRows: visible,
    selectedIds: ['AA-BB-CC-00-00-03'],
    visibleColumnIds: extra.visibleColumnIds ?? ['ssid', 'rssiDbm', 'annotation'],
    ...extra,
  });
}

describe('resolveCsvHeaders', () => {
  it('uses column ids and always includes bssid when hidden', () => {
    assert.deepEqual(resolveCsvHeaders(['ssid', 'rssiDbm']), ['bssid', 'ssid', 'rssiDbm']);
  });

  it('keeps bssid in its visible position', () => {
    assert.deepEqual(resolveCsvHeaders(['ssid', 'bssid', 'vendor']), ['ssid', 'bssid', 'vendor']);
  });
});

describe('selectCsvRows', () => {
  const base = {
    allRows: rows,
    visibleRows: visible,
    selectedIds: ['aa:bb:cc:00:00:03'],
    visibleColumnIds: ['ssid'],
  };

  it('visible / selected / all pick the right rows', () => {
    assert.deepEqual(
      selectCsvRows({ ...base, scope: 'visible' }).map((r) => r.bssid),
      ['aa:bb:cc:00:00:01', 'aa:bb:cc:00:00:02']
    );
    assert.deepEqual(
      selectCsvRows({ ...base, scope: 'selected' }).map((r) => r.bssid),
      ['aa:bb:cc:00:00:03']
    );
    assert.deepEqual(
      selectCsvRows({ ...base, scope: 'all' }).map((r) => r.bssid),
      ['aa:bb:cc:00:00:01', 'aa:bb:cc:00:00:02', 'aa:bb:cc:00:00:03']
    );
  });
});

describe('buildCsv', () => {
  it('writes column ids as the header row and always emits bssid', () => {
    const csv = request('visible');
    const header = csv.text.split('\n')[0];
    assert.equal(header, 'bssid,ssid,rssiDbm,annotation');
    assert.ok(csv.text.includes('aa:bb:cc:00:00:01,Campus,-50,ядро'));
    assert.equal(csv.rowCount, 2);
  });

  it('escapes commas and quotes', () => {
    const csv = request('all');
    assert.ok(csv.text.includes('"Lab, ""A"""'));
  });

  it('neutralizes spreadsheet formulas but keeps negative numbers numeric', () => {
    const csv = buildCsv({
      scope: 'all',
      allRows: [
        { bssid: 'aa:bb:cc:00:00:01', ssid: "=cmd|' /C calc'!A0", rssiDbm: -50 },
        { bssid: 'aa:bb:cc:00:00:02', ssid: '+SUM(1,1)', rssiDbm: -60 },
      ],
      visibleRows: [],
      visibleColumnIds: ['ssid', 'rssiDbm'],
    });
    assert.ok(csv.text.includes("'=cmd"));
    assert.ok(csv.text.includes("'+SUM"));
    assert.ok(csv.text.includes(',-50'));
    assert.ok(csv.text.includes(',-60'));
  });

  it('encodes UTF-8 bytes (Cyrillic and emoji survive)', () => {
    const csv = request('all');
    const bytes = encodeCsvUtf8({
      scope: 'all',
      allRows: rows,
      visibleRows: visible,
      selectedIds: ['AA-BB-CC-00-00-03'],
      visibleColumnIds: ['ssid', 'rssiDbm', 'annotation'],
    });
    const decoded = new TextDecoder('utf-8').decode(bytes);
    assert.equal(decoded, csv.text);
    assert.ok(decoded.includes('Café ☕'));
    assert.ok(decoded.includes('гость'));
    assert.notEqual(bytes[0], 0xef); // no BOM by default
  });

  it('selected scope is empty when nothing is selected', () => {
    const csv = request('selected', { selectedIds: [] });
    assert.equal(csv.rowCount, 0);
    assert.equal(csv.text, 'bssid,ssid,rssiDbm,annotation\n');
  });
});
