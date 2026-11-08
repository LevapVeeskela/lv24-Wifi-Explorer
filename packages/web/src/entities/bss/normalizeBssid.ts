/** Normalized row id: lowercase colon-separated MAC. */
export function normalizeBssid(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  const parts = trimmed.split(/[:-]/).filter(Boolean);
  if (parts.length !== 6) return trimmed;
  return parts.map((p) => p.padStart(2, '0')).join(':');
}

export function bssidRowId(bssid: string | null | undefined): string {
  return normalizeBssid(bssid) ?? `unknown-${Math.random().toString(36).slice(2, 9)}`;
}
