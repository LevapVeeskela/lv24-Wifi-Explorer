import type { Oui24 } from '@/domain/identity';
import type { VendorView } from '@/domain/vendor';
import type { BssidInput, LoadedOuiRegistry, RegistryInput } from './lookup';

export function setDefaultOuiRegistry(registry: LoadedOuiRegistry | null): void;
export function getDefaultOuiRegistry(): LoadedOuiRegistry | null;
export function createOuiRegistry(
  records: ReadonlyMap<string, string> | Iterable<readonly [string, string]>,
  meta: { fileName: string; generatedAt: string }
): LoadedOuiRegistry;
export function lookupVendor(bssid?: BssidInput, registry?: RegistryInput | null): VendorView;
export function parseBssid(raw: string): { octets: number[]; oui: Oui24; canonical: string } | null;
