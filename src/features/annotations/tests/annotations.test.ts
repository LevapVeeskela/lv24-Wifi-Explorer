import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { exportAnnotationCsv, importAnnotationCsv } from '../annotationCsv';
import { matchBssidPattern } from '../matchPattern';
import {
  ANNOTATIONS_STORAGE_KEY,
  loadAnnotations,
  saveAnnotations,
  upsertAnnotation,
} from '../persist';
import { resolveAnnotation } from '../resolveAnnotation';
import type { AnnotationStorage } from '../types';

function memoryStorage(initial?: string): AnnotationStorage {
  const map = new Map<string, string>();
  if (initial != null) map.set(ANNOTATIONS_STORAGE_KEY, initial);
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

describe('matchBssidPattern', () => {
  const bssid = 'A8:9D:21:74:24:3E';

  it('matches exact BSSID ignoring case and separators', () => {
    assert.equal(matchBssidPattern('a8:9d:21:74:24:3e', bssid), true);
    assert.equal(matchBssidPattern('A8-9D-21-74-24-3E', bssid), true);
    assert.equal(matchBssidPattern('a8:9d:21:74:24:3f', bssid), false);
  });

  it('supports * (0+ hex) and ? (1 hex)', () => {
    assert.equal(matchBssidPattern('A8:9D:21:74:24:*', bssid), true);
    assert.equal(matchBssidPattern('a8:9d:21:*', bssid), true);
    assert.equal(matchBssidPattern('aa:bb:*', bssid), false);
    assert.equal(matchBssidPattern('a8:9d:21:74:24:??', bssid), true);
    assert.equal(matchBssidPattern('a8:9d:21:74:24:3?', bssid), true);
    assert.equal(matchBssidPattern('*', bssid), true);
  });
});

describe('resolveAnnotation', () => {
  it('lets a longer exact pattern beat a wildcard', () => {
    const text = resolveAnnotation('aa:bb:cc:dd:ee:ff', [
      { id: '1', bssidPattern: 'aa:bb:cc:*', text: 'oui' },
      { id: '2', bssidPattern: 'aa:bb:cc:dd:ee:ff', text: 'exact' },
    ]);
    assert.equal(text, 'exact');
  });

  it('prefers the longer wildcard literal', () => {
    const text = resolveAnnotation('aa:bb:cc:dd:ee:ff', [
      { id: '1', bssidPattern: 'aa:bb:*', text: 'short' },
      { id: '2', bssidPattern: 'aa:bb:cc:dd:*', text: 'long' },
    ]);
    assert.equal(text, 'long');
  });
});

describe('persist', () => {
  it('round-trips rules through lv24.wifi-explorer.annotations', () => {
    const storage = memoryStorage();
    const rules = upsertAnnotation([], { bssidPattern: 'aa:bb:cc:*', text: 'lab' });
    saveAnnotations(rules, storage);
    const raw = storage.getItem(ANNOTATIONS_STORAGE_KEY);
    assert.ok(raw);
    assert.ok(raw.includes('"version":1'));
    const loaded = loadAnnotations(storage);
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].bssidPattern, 'aa:bb:cc:*');
    assert.equal(loaded[0].text, 'lab');
  });
});

describe('annotation csv', () => {
  it('uses bssid_pattern,text headers', () => {
    const csv = exportAnnotationCsv([{ id: '1', bssidPattern: 'aa:bb:*', text: 'x,y' }]);
    assert.equal(csv.split('\n')[0], 'bssid_pattern,text');
    const back = importAnnotationCsv(csv);
    assert.equal(back[0].bssidPattern, 'aa:bb:*');
    assert.equal(back[0].text, 'x,y');
  });
});
