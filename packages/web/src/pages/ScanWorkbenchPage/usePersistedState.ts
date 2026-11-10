import { useCallback, useEffect, useState } from 'react';
import {
  PANE_LAYOUT_DEFAULT,
  STORAGE_PANES,
  type StoredPaneLayout,
} from '@/shared/lib/persistence/keys';
import { loadColumnVisibility, saveColumnVisibility } from '@/features/scan-settings';

export function usePersistedColumnVisibility(): [
  Record<string, boolean>,
  (model: Record<string, boolean>) => void,
] {
  const [model, setModel] = useState<Record<string, boolean>>(() => loadColumnVisibility());

  const update = useCallback((next: Record<string, boolean>) => {
    setModel(next);
    saveColumnVisibility(next);
  }, []);

  return [model, update];
}

export function usePersistedPaneLayout(): [StoredPaneLayout, (next: StoredPaneLayout) => void] {
  const [layout, setLayout] = useState<StoredPaneLayout>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PANES);
      if (raw) return { ...PANE_LAYOUT_DEFAULT, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
    return PANE_LAYOUT_DEFAULT;
  });

  const update = useCallback((next: StoredPaneLayout) => {
    setLayout(next);
    try {
      localStorage.setItem(STORAGE_PANES, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  return [layout, update];
}

export function useShellHeight(): number {
  const [height, setHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 640
  );

  useEffect(() => {
    const onResize = () => setHeight(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return height;
}
