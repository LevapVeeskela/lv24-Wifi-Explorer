import { describe, expect, it } from 'vitest';
import { MAX_COLORING_RULES } from './constants';
import {
  exportColoringRules,
  importColoringRules,
  importColoringRulesConfig,
} from './importExport';
import type { ColoringRule, ColoringRulesConfig } from './types';

function rule(partial: Partial<ColoringRule> = {}): ColoringRule {
  return {
    id: 'r1',
    name: 'Home',
    enabled: true,
    priority: 0,
    color: '#ff0000',
    field: 'ssid',
    op: 'contains',
    value: 'home',
    ...partial,
  };
}

const config: ColoringRulesConfig = {
  enabled: true,
  rules: [
    rule({ id: 'a', priority: 0, color: '#ff0000' }),
    rule({
      id: 'b',
      priority: 1,
      color: '#00ff00',
      field: 'band',
      op: 'equals',
      value: '5',
    }),
  ],
};

describe('exportColoringRules', () => {
  it('writes versioned JSON with normalized priorities', () => {
    const payload = JSON.parse(
      exportColoringRules({
        enabled: false,
        rules: [rule({ priority: 3 }), rule({ id: 'r2', priority: 3 })],
      })
    );
    expect(payload.version).toBe(1);
    expect(payload.enabled).toBe(false);
    expect(payload.rules.map((r: ColoringRule) => r.priority)).toEqual([3, 4]);
  });
});

describe('importColoringRules', () => {
  it('round-trips an exported payload', () => {
    const result = importColoringRules(exportColoringRules(config));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.store).toEqual({
      version: 1,
      enabled: true,
      rules: config.rules,
    });
  });

  it('accepts a bare rule array', () => {
    const result = importColoringRules(JSON.stringify([rule()]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.store.enabled).toBe(true);
    expect(result.store.rules).toHaveLength(1);
  });

  it('strips unknown properties on import', () => {
    const result = importColoringRules(
      JSON.stringify({ version: 1, rules: [{ ...rule(), bogus: true }] })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.store.rules[0]).not.toHaveProperty('bogus');
  });

  it('rejects empty input and corrupted JSON', () => {
    expect(importColoringRules('   ')).toEqual({ ok: false, error: 'empty' });
    expect(importColoringRules('{"version":1,"rules":[')).toEqual({
      ok: false,
      error: 'invalid-json',
    });
    expect(importColoringRules('null').ok).toBe(false);
    expect(importColoringRules('42').ok).toBe(false);
    expect(importColoringRules('"rules"').ok).toBe(false);
  });

  it('rejects bad shapes', () => {
    expect(importColoringRules('{}')).toEqual({
      ok: false,
      error: 'invalid-shape',
    });
    expect(importColoringRules('{"rules":"nope"}')).toEqual({
      ok: false,
      error: 'invalid-shape',
    });
    expect(importColoringRules('{"version":2,"rules":[]}')).toEqual({
      ok: false,
      error: 'invalid-shape',
    });
    expect(importColoringRules('{"enabled":"yes","rules":[]}')).toEqual({
      ok: false,
      error: 'invalid-shape',
    });
  });

  it('rejects a payload with any invalid rule', () => {
    const result = importColoringRules(
      JSON.stringify({ version: 1, rules: [rule(), rule({ color: '#xyz' })] })
    );
    expect(result).toEqual({ ok: false, error: 'invalid-rule', index: 1 });
  });

  it('rejects more than the rule cap', () => {
    const rules = Array.from({ length: MAX_COLORING_RULES + 1 }, (_, index) =>
      rule({ id: `r${index}` })
    );
    expect(importColoringRules(JSON.stringify(rules))).toEqual({
      ok: false,
      error: 'too-many-rules',
    });
  });

  it('exposes a config helper for write-through import', () => {
    expect(importColoringRulesConfig(exportColoringRules(config))).toEqual(config);
    expect(importColoringRulesConfig('nope')).toBeNull();
  });
});
