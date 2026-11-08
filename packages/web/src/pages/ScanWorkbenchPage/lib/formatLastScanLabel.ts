/** Compact "last seen" age label for the status bar. */
export function formatLastScanLabel(iso: string | null): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '—';
  const deltaSec = Math.round((Date.now() - then) / 1000);
  if (deltaSec < 2) return 'now';
  if (deltaSec < 60) return `${deltaSec}s`;
  if (deltaSec < 3600) return `${Math.round(deltaSec / 60)}m`;
  return `${Math.round(deltaSec / 3600)}h`;
}
