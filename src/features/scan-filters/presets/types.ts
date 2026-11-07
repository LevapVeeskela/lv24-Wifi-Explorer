import type { ScanWorkbenchFilters } from '../types';

/** A named, persisted set of workbench filters the user can re-apply. */
export type FilterPreset = {
  id: string;
  name: string;
  filters: ScanWorkbenchFilters;
};

export type FilterPresetsStoreV1 = {
  version: 1;
  presets: FilterPreset[];
};

export type FilterPresetsStorage = Pick<Storage, 'getItem' | 'setItem'>;
