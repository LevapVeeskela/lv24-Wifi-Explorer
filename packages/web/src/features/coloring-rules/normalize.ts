import {
  COLORING_FIELDS,
  COLORING_OPS,
  DEFAULT_COLORING_RULES,
  HEX_COLOR_RE,
  MAX_COLORING_RULES,
} from './constants';
import type {
  ColoringField,
  ColoringOp,
  ColoringRule,
  ColoringRulesConfig,
  ColoringRulesStoreV1,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isColoringField(value: unknown): value is ColoringField {
  return typeof value === 'string' && COLORING_FIELDS.includes(value as ColoringField);
}

function isColoringOp(value: unknown): value is ColoringOp {
  return typeof value === 'string' && COLORING_OPS.includes(value as ColoringOp);
}

export function newColoringRuleId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // fall through to random id
  }
  return `rule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Lowercase, validated hex color; null when the value is not `#rgb`/`#rrggbb`. */
export function normalizeColor(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  if (!HEX_COLOR_RE.test(trimmed)) return null;
  if (trimmed.length === 4) {
    return `#${trimmed
      .slice(1)
      .split('')
      .map((char) => `${char}${char}`)
      .join('')}`;
  }
  return trimmed;
}

function normalizePriority(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(9_999, Math.round(value)));
}

/** Strips unknown properties and re-validates a rule; null when unusable. */
export function normalizeColoringRule(value: unknown, fallbackPriority = 0): ColoringRule | null {
  if (!isRecord(value)) return null;

  const color = normalizeColor(value.color);
  if (!color) return null;
  if (!isColoringField(value.field) || !isColoringOp(value.op)) return null;

  const rawValue = value.value;
  const stringValue =
    typeof rawValue === 'string'
      ? rawValue
      : typeof rawValue === 'number' && Number.isFinite(rawValue)
        ? String(rawValue)
        : null;
  if (stringValue === null) return null;

  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const id =
    typeof value.id === 'string' && value.id.trim() ? value.id.trim() : newColoringRuleId();

  return {
    id,
    name: name || 'Rule',
    enabled: typeof value.enabled === 'boolean' ? value.enabled : true,
    priority: normalizePriority(value.priority, fallbackPriority),
    color,
    field: value.field,
    op: value.op,
    value: stringValue,
  };
}

/**
 * Sorts by priority (ascending, stable) and makes priorities unique, so the
 * evaluation order is fully deterministic.
 */
export function withUniquePriorities(rules: readonly ColoringRule[]): ColoringRule[] {
  const sorted = rules
    .map((rule, index) => ({ rule, index }))
    .sort((a, b) => a.rule.priority - b.rule.priority || a.index - b.index)
    .map((entry) => entry.rule);

  let previous = Number.NEGATIVE_INFINITY;
  return sorted.map((rule) => {
    const priority = rule.priority > previous ? rule.priority : previous + 1;
    previous = priority;
    return priority === rule.priority ? rule : { ...rule, priority };
  });
}

/** Lenient normalization: drops invalid rules, caps the list at 100. */
export function normalizeColoringRules(value: unknown): ColoringRule[] {
  if (!Array.isArray(value)) return [];
  const rules: ColoringRule[] = [];
  for (const entry of value) {
    if (rules.length >= MAX_COLORING_RULES) break;
    const rule = normalizeColoringRule(entry, rules.length);
    if (rule) rules.push(rule);
  }
  return withUniquePriorities(rules);
}

/**
 * Lenient normalization of untrusted persisted JSON.
 * Unknown properties and unreadable rules are dropped, never thrown on.
 */
export function normalizeColoringStore(value: unknown): ColoringRulesConfig {
  if (!isRecord(value)) return { ...DEFAULT_COLORING_RULES, rules: [] };
  return {
    enabled: typeof value.enabled === 'boolean' ? value.enabled : DEFAULT_COLORING_RULES.enabled,
    rules: normalizeColoringRules(value.rules),
  };
}

/** Serializable payload with a fixed key order and no unknown properties. */
export function toColoringRulesStore(config: ColoringRulesConfig): ColoringRulesStoreV1 {
  return {
    version: 1,
    enabled: config.enabled,
    rules: withUniquePriorities(normalizeColoringRules(config.rules)),
  };
}
