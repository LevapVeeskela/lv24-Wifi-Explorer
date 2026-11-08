import type { ScanWorkbenchFilters } from '@/features/scan-filters';
import type { OrganizeByValue } from '@/features/scan-organize';

/** localStorage key for the unified workbench profile store. */
export const WORKBENCH_PROFILES_STORAGE_KEY = 'lv24.wifi-explorer.workbench-profiles';

/** Reserved id/name of the synthesized, non-persisted default profile. */
export const BUILT_IN_DEFAULT_PROFILE_ID = 'default';
export const BUILT_IN_DEFAULT_PROFILE_NAME = 'Default';

/** Hard limits shared by the store, import and UI. */
export const MAX_WORKBENCH_PROFILES = 32;
export const MAX_PROFILE_NAME_LENGTH = 64;

/**
 * A named snapshot of the whole scan workbench: visible columns, filters,
 * row grouping and (optionally) the scan interval.
 *
 * The built-in `Default` profile is never persisted — it is synthesized from
 * the shipped defaults on every load (see `builtInDefaultWorkbenchProfile`).
 */
export type WorkbenchProfile = {
  id: string;
  name: string;
  builtIn?: boolean;
  columnVisibility: Record<string, boolean>;
  filters: ScanWorkbenchFilters;
  organizeBy: OrganizeByValue;
  scanIntervalSec?: number;
};

export type WorkbenchProfilesStoreV1 = {
  version: 1;
  /** Built-in `Default` first, then user profiles (max {@link MAX_WORKBENCH_PROFILES}). */
  profiles: WorkbenchProfile[];
  /** `null` when no profile is currently applied. */
  activeProfileId: string | null;
};

export type WorkbenchProfilesStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Subset of workbench state a profile captures. */
export type WorkbenchStateInput = {
  columnVisibility: Record<string, boolean>;
  filters: ScanWorkbenchFilters;
  organizeBy: OrganizeByValue;
  scanIntervalSec?: number;
};

/** Normalized state pieces produced by {@link applyProfileToState}. */
export type WorkbenchStatePatch = {
  columnVisibility: Record<string, boolean>;
  filters: ScanWorkbenchFilters;
  organizeBy: OrganizeByValue;
  scanIntervalSec?: number;
};

/** Serialized envelope used by export / import. */
export type WorkbenchProfilesExportV1 = {
  version: 1;
  profiles: WorkbenchProfile[];
};
