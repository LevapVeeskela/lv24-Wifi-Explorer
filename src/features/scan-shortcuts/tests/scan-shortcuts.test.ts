import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isGridFocused,
  isSearchFocused,
  resolveScanShortcutActions,
  shouldPreventDefault,
} from '../handleScanShortcut';

function ctx(partial: {
  activeElement?: Element | null;
  searchInput?: HTMLInputElement | null;
  gridRoot?: HTMLElement | null;
  selectedBssid?: string | null;
}) {
  return {
    activeElement: partial.activeElement ?? null,
    searchInput: partial.searchInput ?? null,
    gridRoot: partial.gridRoot ?? null,
    selectedBssid: partial.selectedBssid ?? null,
  };
}

describe('resolveScanShortcutActions', () => {
  it('Mod+F focuses search', () => {
    const actions = resolveScanShortcutActions(
      { key: 'f', metaKey: true, ctrlKey: false },
      ctx({}),
    );
    assert.deepEqual(actions, [{ type: 'focusSearch' }]);
    assert.equal(shouldPreventDefault(actions[0]!), true);
  });

  it('Escape clears search when search focused', () => {
    const search = { contains: () => false } as unknown as HTMLInputElement;
    const actions = resolveScanShortcutActions(
      { key: 'Escape', metaKey: false, ctrlKey: false },
      ctx({ searchInput: search, activeElement: search }),
    );
    assert.deepEqual(actions, [{ type: 'clearSearch' }]);
  });

  it('Mod+Shift+S starts scan (Electron menu parity)', () => {
    const actions = resolveScanShortcutActions(
      { key: 's', metaKey: true, ctrlKey: false, shiftKey: true },
      ctx({}),
    );
    assert.deepEqual(actions, [{ type: 'startScan' }]);
    assert.equal(shouldPreventDefault(actions[0]!), true);
  });

  it('Mod+Shift+T stops scan (Electron menu parity)', () => {
    const actions = resolveScanShortcutActions(
      { key: 't', metaKey: true, ctrlKey: false, shiftKey: true },
      ctx({}),
    );
    assert.deepEqual(actions, [{ type: 'stopScan' }]);
    assert.equal(shouldPreventDefault(actions[0]!), true);
  });

  it('Mod+S saves snapshot without shift', () => {
    const actions = resolveScanShortcutActions(
      { key: 's', metaKey: true, ctrlKey: false, shiftKey: false },
      ctx({}),
    );
    assert.deepEqual(actions, [{ type: 'saveSnapshot' }]);
  });

  it('Mod+P does not toggle scan (reserved for print)', () => {
    const actions = resolveScanShortcutActions(
      { key: 'p', metaKey: true, ctrlKey: false, shiftKey: false },
      ctx({}),
    );
    assert.deepEqual(actions, []);
  });

  it('Mod+1..5 switch details tabs', () => {
    assert.deepEqual(
      resolveScanShortcutActions({ key: '2', metaKey: true, ctrlKey: false }, ctx({})),
      [{ type: 'setDetailsTab', tab: 'signal' }],
    );
    assert.deepEqual(
      resolveScanShortcutActions({ key: '4', metaKey: true, ctrlKey: false }, ctx({})),
      [{ type: 'setDetailsTab', tab: 'compare' }],
    );
    assert.deepEqual(
      resolveScanShortcutActions({ key: '5', metaKey: true, ctrlKey: false }, ctx({})),
      [{ type: 'setDetailsTab', tab: 'advanced' }],
    );
  });

  it('Mod+C copies BSSID only when grid focused', () => {
    const cell = {} as Element;
    const grid = {
      contains: (el: Element | null) => el === cell,
    } as unknown as HTMLElement;

    assert.deepEqual(
      resolveScanShortcutActions(
        { key: 'c', metaKey: true, ctrlKey: false },
        ctx({ gridRoot: grid, activeElement: cell, selectedBssid: 'aa:bb:cc:dd:ee:ff' }),
      ),
      [{ type: 'copyBssid', bssid: 'aa:bb:cc:dd:ee:ff' }],
    );

    assert.deepEqual(
      resolveScanShortcutActions(
        { key: 'c', metaKey: true, ctrlKey: false },
        ctx({ gridRoot: grid, activeElement: null, selectedBssid: 'aa:bb:cc:dd:ee:ff' }),
      ),
      [],
    );
  });
});

describe('focus helpers', () => {
  it('isGridFocused respects contains', () => {
    const inner = {} as Element;
    const grid = {
      contains: (el: Element | null) => el === inner,
    } as unknown as HTMLElement;
    assert.equal(isGridFocused(ctx({ gridRoot: grid, activeElement: inner })), true);
    assert.equal(isGridFocused(ctx({ gridRoot: grid, activeElement: null })), false);
  });

  it('isSearchFocused matches input or descendants', () => {
    const search = {
      contains: () => false,
    } as unknown as HTMLInputElement;
    assert.equal(isSearchFocused(ctx({ searchInput: search, activeElement: search })), true);
  });
});
