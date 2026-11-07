import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { GridRowSelectionModel } from '@mui/x-data-grid-pro';
import { clampRowSelectionModel, selectedRowIdsFromModel } from './selectionModel';

function include(ids: string[]): GridRowSelectionModel {
  return { type: 'include', ids: new Set(ids) };
}

describe('clampRowSelectionModel', () => {
  it('passes through when at or below max', () => {
    const prev = include(['a', 'b']);
    const next = include(['a', 'b', 'c']);
    const clamped = clampRowSelectionModel(next, prev, 3);
    assert.equal(clamped.type, 'include');
    assert.deepEqual(selectedRowIdsFromModel(clamped).sort(), ['a', 'b', 'c']);
  });

  it('drops earliest selection when exceeding max', () => {
    const prev = include(['aa:bb:cc:00:00:01', 'aa:bb:cc:00:00:02', 'aa:bb:cc:00:00:03']);
    const next = include([
      'aa:bb:cc:00:00:01',
      'aa:bb:cc:00:00:02',
      'aa:bb:cc:00:00:03',
      'aa:bb:cc:00:00:04',
    ]);
    const clamped = clampRowSelectionModel(next, prev, 3);
    assert.deepEqual(selectedRowIdsFromModel(clamped), [
      'aa:bb:cc:00:00:02',
      'aa:bb:cc:00:00:03',
      'aa:bb:cc:00:00:04',
    ]);
  });
});
