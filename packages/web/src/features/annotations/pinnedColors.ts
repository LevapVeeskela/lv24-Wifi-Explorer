import type { AnnotationStorage, PinnedColor, PinnedColorStoreV1 } from './types';
import { defaultAnnotationStorage } from './persist';

/** localStorage key for pinned per-BSSID chart colors. */
export const PINNED_COLORS_STORAGE_KEY = 'lv24.wifi-explorer.pinned-colors';

/** Six swatch colors offered in the details pane pin-color row. */
export const PIN_COLOR_PALETTE = [
  '#FB6E4A',
  '#FBBF24',
  '#34D399',
  '#38BDF8',
  '#A78BFA',
  '#FB7185',
] as const;

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_RE.test(value.trim());
}

export function normalizePinnedBssid(bssid: string): string {
  return bssid.trim().toLowerCase();
}

function asPinnedColor(value: unknown): PinnedColor | null {
  if (!value || typeof value !== 'object') return null;
  const rec = value as Record<string, unknown>;
  if (typeof rec.bssid !== 'string' || typeof rec.color !== 'string') return null;
  const bssid = normalizePinnedBssid(rec.bssid);
  const color = rec.color.trim().toLowerCase();
  if (!bssid || !isValidHexColor(color)) return null;
  return { bssid, color };
}

function parseStore(raw: string | null): PinnedColor[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    const list = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object'
        ? (parsed as PinnedColorStoreV1).colors
        : null;
    if (!Array.isArray(list)) return [];
    return list.map(asPinnedColor).filter((color): color is PinnedColor => color != null);
  } catch {
    return [];
  }
}

export function loadPinnedColors(
  storage: AnnotationStorage | null = defaultAnnotationStorage()
): PinnedColor[] {
  if (!storage) return [];
  try {
    return parseStore(storage.getItem(PINNED_COLORS_STORAGE_KEY));
  } catch {
    return [];
  }
}

/** Atomic persist: one setItem with the full document, or nothing on failure. */
export function savePinnedColors(
  colors: readonly PinnedColor[],
  storage: AnnotationStorage | null = defaultAnnotationStorage()
): void {
  if (!storage) return;
  const payload: PinnedColorStoreV1 = { version: 1, colors: [...colors] };
  try {
    storage.setItem(PINNED_COLORS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // quota/private mode: keep in memory
  }
}

/** Set/replace a pin. Returns null for invalid input (no mutation). */
export function setPinnedColor(
  colors: readonly PinnedColor[],
  bssid: string,
  color: string
): PinnedColor[] | null {
  const key = normalizePinnedBssid(bssid);
  const hex = color.trim().toLowerCase();
  if (!key || !isValidHexColor(hex)) return null;
  const index = colors.findIndex((item) => item.bssid === key);
  if (index >= 0) {
    const next = [...colors];
    next[index] = { bssid: key, color: hex };
    return next;
  }
  return [...colors, { bssid: key, color: hex }];
}

export function removePinnedColor(colors: readonly PinnedColor[], bssid: string): PinnedColor[] {
  const key = normalizePinnedBssid(bssid);
  return colors.filter((item) => item.bssid !== key);
}

export function pinnedColorFor(colors: readonly PinnedColor[], bssid: string): string | null {
  const key = normalizePinnedBssid(bssid);
  return colors.find((item) => item.bssid === key)?.color ?? null;
}
