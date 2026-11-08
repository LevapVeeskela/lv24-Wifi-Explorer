/** Whole-query negation for search-filter actions (grid cell context menu). */

export function negateScanQuery(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('!') || /^not\s+/i.test(trimmed)) return trimmed;
  return `!${trimmed}`;
}
