import { useCallback, useMemo, useState } from 'react';
import type { ScanWorkbenchFilters } from '../types';
import type { FilterPreset, FilterPresetsStoreV1 } from './types';
import {
  createFilterPreset,
  deleteFilterPreset,
  loadFilterPresetsStore,
  saveFilterPresetsStore,
} from './persist';

export type UseFilterPresetsOptions = {
  /** Current workbench filters — captured when saving a new preset. */
  currentFilters: ScanWorkbenchFilters;
  /** Apply a preset's filters to the workbench. */
  onApplyFilters: (next: ScanWorkbenchFilters) => void;
};

export type UseFilterPresetsResult = {
  presets: FilterPreset[];
  saveCurrentAsPreset: (name: string) => void;
  applyPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => void;
};

function persist(store: FilterPresetsStoreV1): FilterPresetsStoreV1 {
  saveFilterPresetsStore(store);
  return store;
}

export function useFilterPresets({
  currentFilters,
  onApplyFilters,
}: UseFilterPresetsOptions): UseFilterPresetsResult {
  const [store, setStore] = useState<FilterPresetsStoreV1>(() => loadFilterPresetsStore());

  const presets = useMemo(() => store.presets, [store]);

  const saveCurrentAsPreset = useCallback(
    (name: string) => {
      setStore((prev) => persist(createFilterPreset(prev, name, currentFilters)));
    },
    [currentFilters]
  );

  const applyPreset = useCallback(
    (presetId: string) => {
      setStore((prev) => {
        const preset = prev.presets.find((p) => p.id === presetId);
        if (!preset) return prev;
        onApplyFilters({ ...preset.filters });
        return prev;
      });
    },
    [onApplyFilters]
  );

  const deletePreset = useCallback((presetId: string) => {
    setStore((prev) => persist(deleteFilterPreset(prev, presetId)));
  }, []);

  return { presets, saveCurrentAsPreset, applyPreset, deletePreset };
}
