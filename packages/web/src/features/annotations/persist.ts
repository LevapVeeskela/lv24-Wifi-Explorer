import type { AnnotationRule, AnnotationStorage, AnnotationStoreV1 } from './types';

/** localStorage key for annotation rules. */
export const ANNOTATIONS_STORAGE_KEY = 'lv24.wifi-explorer.annotations';

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ann-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function asRule(value: unknown): AnnotationRule | null {
  if (!value || typeof value !== 'object') return null;
  const rec = value as Record<string, unknown>;
  const bssidPattern = typeof rec.bssidPattern === 'string' ? rec.bssidPattern.trim() : '';
  const text = typeof rec.text === 'string' ? rec.text : '';
  if (!bssidPattern) return null;
  const id = typeof rec.id === 'string' && rec.id.trim() ? rec.id : newId();
  return { id, bssidPattern, text };
}

function parseStore(raw: string | null): AnnotationRule[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(asRule).filter((r): r is AnnotationRule => r != null);
    }
    if (parsed && typeof parsed === 'object') {
      const rec = parsed as AnnotationStoreV1;
      if (!Array.isArray(rec.rules)) return [];
      return rec.rules.map(asRule).filter((r): r is AnnotationRule => r != null);
    }
  } catch {
    return [];
  }
  return [];
}

export function defaultAnnotationStorage(): AnnotationStorage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    return null;
  }
  return null;
}

export function loadAnnotations(
  storage: AnnotationStorage | null = defaultAnnotationStorage()
): AnnotationRule[] {
  if (!storage) return [];
  try {
    return parseStore(storage.getItem(ANNOTATIONS_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function saveAnnotations(
  rules: readonly AnnotationRule[],
  storage: AnnotationStorage | null = defaultAnnotationStorage()
): void {
  if (!storage) return;
  const payload: AnnotationStoreV1 = { version: 1, rules: [...rules] };
  try {
    storage.setItem(ANNOTATIONS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // quota / private mode — keep in-memory only
  }
}

export function upsertAnnotation(
  rules: readonly AnnotationRule[],
  input: { id?: string; bssidPattern: string; text: string }
): AnnotationRule[] {
  const pattern = input.bssidPattern.trim();
  const text = input.text;
  if (input.id) {
    const idx = rules.findIndex((r) => r.id === input.id);
    if (idx >= 0) {
      const next = [...rules];
      next[idx] = { ...next[idx], bssidPattern: pattern, text };
      return next;
    }
  }
  const existing = rules.findIndex(
    (r) => r.bssidPattern.trim().toLowerCase() === pattern.toLowerCase()
  );
  if (existing >= 0) {
    const next = [...rules];
    next[existing] = { ...next[existing], text };
    return next;
  }
  return [...rules, { id: input.id ?? newId(), bssidPattern: pattern, text }];
}

export function removeAnnotation(rules: readonly AnnotationRule[], id: string): AnnotationRule[] {
  return rules.filter((r) => r.id !== id);
}

export function createAnnotationRule(bssidPattern: string, text: string): AnnotationRule {
  return { id: newId(), bssidPattern: bssidPattern.trim(), text };
}
