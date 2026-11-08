import { DEFAULT_COLUMN_VISIBILITY } from '@/entities/columns';

export function normalizeColumnVisibility(
  raw: Record<string, boolean> | undefined
): Record<string, boolean> {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_COLUMN_VISIBILITY };
  return { ...DEFAULT_COLUMN_VISIBILITY, ...raw };
}
