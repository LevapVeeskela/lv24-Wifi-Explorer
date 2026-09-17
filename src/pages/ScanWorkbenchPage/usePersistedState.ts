import { useCallback, useEffect, useState } from 'react';
import {
  PANE_LAYOUT_DEFAULT,
  STORAGE_COLUMNS,
  STORAGE_PANES,
  type StoredPaneLayout,
} from '@/shared/lib/persistence/keys';

export function usePersistedColumnVisibility(
  defaultModel: Record<string, boolean>
): [Record<string, boolean>, (model: Record<string, boolean>) => void] {
  const [model, setModel] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_COLUMNS);
      if (raw) return { ...defaultModel, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
    return defaultModel;
  });

  const update = useCallback((next: Record<string, boolean>) => {
    setModel(next);
    try {
      localStorage.setItem(STORAGE_COLUMNS, JSON.stringify(next));
    } catch {
      // ignore
    }
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
