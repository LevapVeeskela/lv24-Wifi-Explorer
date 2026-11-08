import { useCallback, useState } from 'react';
import { DEFAULT_COLUMN_VISIBILITY } from '@/entities/columns';
import { loadColumnVisibility, saveColumnVisibility } from './columnVisibilityPersist';

export function useColumnVisibility(): {
  columnVisibility: Record<string, boolean>;
  setColumnVisibility: (next: Record<string, boolean>) => void;
  resetColumnVisibility: () => void;
} {
  const [columnVisibility, setColumnVisibilityState] = useState<Record<string, boolean>>(() =>
    loadColumnVisibility()
  );

  const setColumnVisibility = useCallback((next: Record<string, boolean>) => {
    setColumnVisibilityState(next);
    saveColumnVisibility(next);
  }, []);

  const resetColumnVisibility = useCallback(() => {
    const next = { ...DEFAULT_COLUMN_VISIBILITY };
    setColumnVisibilityState(next);
    saveColumnVisibility(next);
  }, []);

  return { columnVisibility, setColumnVisibility, resetColumnVisibility };
}
