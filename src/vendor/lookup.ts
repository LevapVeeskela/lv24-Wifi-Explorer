/**
 * Типизированный фасад над `lookup.mjs` для Vite / tsc.
 * Реализация — clean-room IEEE MA-L, см. JSDoc в lookup.mjs.
 */
import type { LocationGated, Oui24 } from '../domain/identity';
import type { OuiRegistry, VendorView } from '../domain/vendor';
import {
  createOuiRegistry as createOuiRegistryJs,
  getDefaultOuiRegistry as getDefaultOuiRegistryJs,
  lookupVendor as lookupVendorJs,
  parseBssid as parseBssidJs,
  setDefaultOuiRegistry as setDefaultOuiRegistryJs,
} from './lookup.mjs';

export type BssidInput = string | null | undefined | LocationGated<string | null>;

export interface LoadedOuiRegistry extends OuiRegistry {
  readonly records: ReadonlyMap<Oui24, string>;
}

export type RegistryInput = LoadedOuiRegistry | ReadonlyMap<string, string>;

export function setDefaultOuiRegistry(registry: LoadedOuiRegistry | null): void {
  setDefaultOuiRegistryJs(registry);
}

export function getDefaultOuiRegistry(): LoadedOuiRegistry | null {
  return getDefaultOuiRegistryJs();
}

export function createOuiRegistry(
  records: ReadonlyMap<string, string> | Iterable<readonly [string, string]>,
  meta: Pick<OuiRegistry, 'fileName' | 'generatedAt'>,
): LoadedOuiRegistry {
  return createOuiRegistryJs(records, meta);
}

export function lookupVendor(bssid?: BssidInput, registry?: RegistryInput | null): VendorView {
  return lookupVendorJs(bssid, registry);
}

export function parseBssid(
  raw: string,
): { octets: number[]; oui: Oui24; canonical: string } | null {
  return parseBssidJs(raw);
}
