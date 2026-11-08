import { useCallback, useMemo, useState } from 'react';
import {
  BUILT_IN_DEFAULT_PROFILE_ID,
  type ColumnProfilesStoreV1,
  type ColumnVisibilityProfile,
} from './types';
import {
  createCustomProfile,
  deleteCustomProfile,
  listProfiles,
  loadColumnProfilesStore,
  profileById,
  saveColumnProfilesStore,
  selectActiveProfile,
  updateCustomProfileVisibility,
} from './persist';

export type UseColumnProfilesOptions = {
  columnVisibility: Record<string, boolean>;
  onApplyVisibility: (next: Record<string, boolean>) => void;
};

export type UseColumnProfilesResult = {
  profiles: ColumnVisibilityProfile[];
  activeProfileId: string;
  activeProfile: ColumnVisibilityProfile;
  switchProfile: (profileId: string) => void;
  saveCurrentAsProfile: (name: string) => void;
  updateActiveProfileFromCurrent: () => void;
  deleteProfile: (profileId: string) => void;
  resetToDefault: () => void;
};

function persist(store: ColumnProfilesStoreV1): ColumnProfilesStoreV1 {
  saveColumnProfilesStore(store);
  return store;
}

export function useColumnProfiles({
  columnVisibility,
  onApplyVisibility,
}: UseColumnProfilesOptions): UseColumnProfilesResult {
  const [store, setStore] = useState<ColumnProfilesStoreV1>(() => loadColumnProfilesStore());

  const profiles = useMemo(() => listProfiles(store), [store]);
  const activeProfile = useMemo(
    () => profileById(store, store.activeProfileId) ?? listProfiles(store)[0]!,
    [store]
  );

  const applyProfile = useCallback(
    (profile: ColumnVisibilityProfile) => {
      onApplyVisibility({ ...profile.visibility });
    },
    [onApplyVisibility]
  );

  const switchProfile = useCallback(
    (profileId: string) => {
      setStore((prev) => {
        const profile = profileById(prev, profileId);
        if (!profile) return prev;
        applyProfile(profile);
        return persist(selectActiveProfile(prev, profileId));
      });
    },
    [applyProfile]
  );

  const saveCurrentAsProfile = useCallback(
    (name: string) => {
      setStore((prev) => {
        const next = persist(createCustomProfile(prev, name, columnVisibility));
        const created = profileById(next, next.activeProfileId);
        if (created) applyProfile(created);
        return next;
      });
    },
    [applyProfile, columnVisibility]
  );

  const updateActiveProfileFromCurrent = useCallback(() => {
    setStore((prev) => {
      if (prev.activeProfileId === BUILT_IN_DEFAULT_PROFILE_ID) return prev;
      return persist(updateCustomProfileVisibility(prev, prev.activeProfileId, columnVisibility));
    });
  }, [columnVisibility]);

  const deleteProfile = useCallback(
    (profileId: string) => {
      setStore((prev) => {
        const wasActive = prev.activeProfileId === profileId;
        const next = deleteCustomProfile(prev, profileId);
        if (next === prev) return prev;
        const saved = persist(next);
        if (wasActive) {
          applyProfile(profileById(saved, BUILT_IN_DEFAULT_PROFILE_ID)!);
        }
        return saved;
      });
    },
    [applyProfile]
  );

  const resetToDefault = useCallback(() => {
    setStore((prev) => {
      const next = persist(selectActiveProfile(prev, BUILT_IN_DEFAULT_PROFILE_ID));
      const def = profileById(next, BUILT_IN_DEFAULT_PROFILE_ID)!;
      applyProfile(def);
      return next;
    });
  }, [applyProfile]);

  return {
    profiles,
    activeProfileId: store.activeProfileId,
    activeProfile,
    switchProfile,
    saveCurrentAsProfile,
    updateActiveProfileFromCurrent,
    deleteProfile,
    resetToDefault,
  };
}
