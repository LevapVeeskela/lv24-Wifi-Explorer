export const BUILT_IN_DEFAULT_PROFILE_ID = 'default';

export type ColumnVisibilityProfile = {
  id: string;
  name: string;
  visibility: Record<string, boolean>;
  builtIn?: boolean;
};

export type ColumnProfilesStoreV1 = {
  version: 1;
  activeProfileId: string;
  profiles: ColumnVisibilityProfile[];
};

export type ColumnProfilesStorage = Pick<Storage, 'getItem' | 'setItem'>;
