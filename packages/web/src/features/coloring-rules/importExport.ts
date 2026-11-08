import { MAX_COLORING_RULES } from './constants';
import {
  normalizeColoringRule,
  normalizeColoringRules,
  toColoringRulesStore,
  withUniquePriorities,
} from './normalize';
import type { ColoringImportResult, ColoringRule, ColoringRulesConfig } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Stable JSON export (2-space indent, fixed key order, unknown props stripped). */
export function exportColoringRules(config: ColoringRulesConfig): string {
  return JSON.stringify(toColoringRulesStore(config), null, 2);
}

/**
 * Strict import: any malformed rule rejects the whole payload, so the user
 * never ends up with a silently half-imported rule set.
 * Accepts a v1 store object, an object with only `rules`, or a bare array.
 */
export function importColoringRules(text: string): ColoringImportResult {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: 'empty' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: 'invalid-json' };
  }

  let enabled = true;
  let rulesValue: unknown;

  if (Array.isArray(parsed)) {
    rulesValue = parsed;
  } else if (isRecord(parsed)) {
    if (parsed.version !== undefined && parsed.version !== 1) {
      return { ok: false, error: 'invalid-shape' };
    }
    rulesValue = parsed.rules;
    if (parsed.enabled !== undefined) {
      if (typeof parsed.enabled !== 'boolean') return { ok: false, error: 'invalid-shape' };
      enabled = parsed.enabled;
    }
  } else {
    return { ok: false, error: 'invalid-shape' };
  }

  if (!Array.isArray(rulesValue)) return { ok: false, error: 'invalid-shape' };
  if (rulesValue.length > MAX_COLORING_RULES) return { ok: false, error: 'too-many-rules' };

  const rules: ColoringRule[] = [];
  for (let index = 0; index < rulesValue.length; index += 1) {
    const rule = normalizeColoringRule(rulesValue[index], index);
    if (!rule) return { ok: false, error: 'invalid-rule', index };
    rules.push(rule);
  }

  return {
    ok: true,
    store: { version: 1, enabled, rules: withUniquePriorities(rules) },
  };
}

/** Convenience for import flows that write straight into the live config. */
export function importColoringRulesConfig(text: string): ColoringRulesConfig | null {
  const result = importColoringRules(text);
  if (!result.ok) return null;
  return {
    enabled: result.store.enabled,
    rules: normalizeColoringRules(result.store.rules),
  };
}
