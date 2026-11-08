/** One user note keyed by exact BSSID or a `*` / `?` pattern. */
export type AnnotationRule = {
  id: string;
  /** Exact MAC (`aa:bb:cc:dd:ee:ff`) or wildcard (`a8:9d:21:*`, `aa:bb:cc:dd:ee:?f`). */
  bssidPattern: string;
  text: string;
};

export type AnnotationStoreV1 = {
  version: 1;
  rules: AnnotationRule[];
};

export type AnnotationStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Per-BSSID pinned chart color (hex, e.g. `#fb6e4a`). */
export type PinnedColor = {
  bssid: string;
  color: string;
};

export type PinnedColorStoreV1 = {
  version: 1;
  colors: PinnedColor[];
};
