import { describe, expect, it } from 'vitest';
import { MAX_COLORING_RULES } from './constants';
import {
  normalizeColoringRule,
  normalizeColoringStore,
  toColoringRulesStore,
  withUniquePriorities,
} from './normalize';
import type { ColoringRule } from './types';

function validRule(partial: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'r1',
    name: 'Home',
    enabled: true,
    priority: 0,
    color: '#FF0000',
    field: 'ssid',
    op: 'contains',
    value: 'home',
    ...partial,
  };
}

describe('normalizeColoringRule', () => {
  it('accepts a valid rule and normalizes the color', () => {
    const result = normalizeColoringRule(validRule());
    expect(result).not.toBeNull();
    expect(result?.color).toBe('#ff0000');
    expect(result?.field).toBe('ssid');
    expect(result?.value).toBe('home');
  });

  it('strips unknown properties', () => {
    const result = normalizeColoringRule(validRule({ extra: 'nope', priority: 3 }));
    expect(Object.keys(result ?? {}).sort()).toEqual([
      'color',
      'enabled',
      'field',
      'id',
      'name',
      'op',
      'priority',
      'value',
    ]);
  });

  it.each(['red', '#gg0', '#12345', '', 42])('rejects invalid color %p', (color) => {
    expect(normalizeColoringRule(validRule({ color }))).toBeNull();
  });

  it('rejects unknown field, op and non-scalar value', () => {
    expect(normalizeColoringRule(validRule({ field: 'noise' }))).toBeNull();
    expect(normalizeColoringRule(validRule({ op: 'matches' }))).toBeNull();
    expect(normalizeColoringRule(validRule({ value: { a: 1 } }))).toBeNull();
    expect(normalizeColoringRule(validRule({ value: null }))).toBeNull();
  });

  it('rejects non-object input', () => {
    for (const input of [null, undefined, 42, 'rule', [], true]) {
      expect(normalizeColoringRule(input)).toBeNull();
    }
  });

  it('coerces numeric values to strings and clamps priority', () => {
    expect(normalizeColoringRule(validRule({ value: -70, priority: -5 }))?.priority).toBe(0);
    expect(normalizeColoringRule(validRule({ value: -70 }))?.value).toBe('-70');
  });

  it('falls back to a generated id and default name', () => {
    const result = normalizeColoringRule(validRule({ id: '  ', name: '' }));
    expect(result?.id).toBeTruthy();
    expect(result?.name).toBe('Rule');
    expect(result?.enabled).toBe(true);
  });

  it('keeps enabled=false and boolean validation', () => {
    expect(normalizeColoringRule(validRule({ enabled: false }))?.enabled).toBe(false);
    expect(normalizeColoringRule(validRule({ enabled: 'yes' }))?.enabled).toBe(true);
  });
});

describe('normalizeColoringStore', () => {
  it('drops unreadable rules and keeps the rest', () => {
    const store = normalizeColoringStore({
      version: 1,
      enabled: false,
      rules: [validRule({ id: 'a' }), validRule({ color: 'nope' }), validRule({ id: 'b' })],
    });
    expect(store.enabled).toBe(false);
    expect(store.rules.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('falls back to defaults for junk input', () => {
    for (const input of [null, 42, 'x', [], {}]) {
      const store = normalizeColoringStore(input);
      expect(store.rules).toEqual([]);
      expect(typeof store.enabled).toBe('boolean');
    }
  });

  it(`caps rules at ${MAX_COLORING_RULES}`, () => {
    const rules = Array.from({ length: MAX_COLORING_RULES + 25 }, (_, index) =>
      validRule({ id: `r${index}`, priority: index })
    );
    expect(normalizeColoringStore({ version: 1, rules }).rules).toHaveLength(MAX_COLORING_RULES);
  });
});

describe('withUniquePriorities', () => {
  it('sorts by priority and removes duplicates deterministically', () => {
    const rules: ColoringRule[] = [
      {
        id: 'c',
        name: 'c',
        enabled: true,
        priority: 5,
        color: '#111111',
        field: 'ssid',
        op: 'equals',
        value: 'a',
      },
      {
        id: 'a',
        name: 'a',
        enabled: true,
        priority: 2,
        color: '#222222',
        field: 'ssid',
        op: 'equals',
        value: 'b',
      },
      {
        id: 'b',
        name: 'b',
        enabled: true,
        priority: 5,
        color: '#333333',
        field: 'ssid',
        op: 'equals',
        value: 'c',
      },
    ];
    const result = withUniquePriorities(rules);
    expect(result.map((r) => r.id)).toEqual(['a', 'c', 'b']);
    expect(result.map((r) => r.priority)).toEqual([2, 5, 6]);
  });
});

describe('toColoringRulesStore', () => {
  it('always writes version 1 with a stable shape', () => {
    const payload = toColoringRulesStore({ enabled: true, rules: [] });
    expect(payload).toEqual({ version: 1, enabled: true, rules: [] });
  });
});
