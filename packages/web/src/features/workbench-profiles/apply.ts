import { normalizeFilterPresetFilters } from '@/features/scan-filters/presets/persist';
import {
  builtInDefaultWorkbenchProfile,
  normalizeOrganizeBy,
  normalizeProfile,
  normalizeProfileName,
  normalizeScanIntervalSec,
  normalizeWorkbenchColumnVisibility,
} from './normalize';
import { type WorkbenchProfile, type WorkbenchStateInput, type WorkbenchStatePatch } from './types';

export type ProfileMeta = {
  id?: string;
  name?: string;
};

const FALLBACK_PROFILE_NAME = 'New profile';

function newProfileId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `wbprof-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Capture the current workbench state as a normalized profile.
 *
 * `filters` are copied verbatim (including `searchQuery`); pages that treat the
 * search box as ephemeral should clear it before calling this.
 */
export function profileFromState(
  input: WorkbenchStateInput,
  meta: ProfileMeta = {}
): WorkbenchProfile {
  const name = normalizeProfileName(meta.name) ?? FALLBACK_PROFILE_NAME;
  const id = meta.id?.trim() || newProfileId();
  return (
    normalizeProfile({
      id,
      name,
      columnVisibility: input.columnVisibility,
      filters: input.filters,
      organizeBy: input.organizeBy,
      ...(input.scanIntervalSec == null ? {} : { scanIntervalSec: input.scanIntervalSec }),
    }) ?? { ...builtInDefaultWorkbenchProfile(), id, name, builtIn: undefined }
  );
}

/**
 * Normalized state pieces to apply to the workbench. Safe to feed straight
 * into the existing column-visibility / filters / organize setters.
 */
export function applyProfileToState(profile: WorkbenchProfile): WorkbenchStatePatch {
  const patch: WorkbenchStatePatch = {
    columnVisibility: normalizeWorkbenchColumnVisibility(profile.columnVisibility),
    filters: normalizeFilterPresetFilters(profile.filters),
    organizeBy: normalizeOrganizeBy(profile.organizeBy),
  };
  const scanIntervalSec = normalizeScanIntervalSec(profile.scanIntervalSec);
  if (scanIntervalSec != null) patch.scanIntervalSec = scanIntervalSec;
  return patch;
}
