/**
 * Заглушка OUI: локальный IEEE MA-L подключает агент vendor.
 * Здесь только биты U/L / I/G и хук поиска организации.
 */

import type { Bssid, LocationGated, Oui24 } from '../domain/identity';
import type { VendorView } from '../domain/vendor';
import { asOui24 } from './identity';

export interface OuiLookupResult {
  organization: string;
  registryFile: string;
}

/** Хук реестра. Без файла — всегда null (organization неизвестна). */
export type OuiLookup = (oui: Oui24) => OuiLookupResult | null;

export const STUB_OUI_LOOKUP: OuiLookup = () => null;

export function ouiFromBssid(bssid: Bssid): Oui24 {
  return asOui24(bssid.slice(0, 8));
}

export function resolveVendorView(
  bssid: LocationGated<Bssid>,
  lookup: OuiLookup = STUB_OUI_LOOKUP
): VendorView {
  if (bssid.status === 'redacted') {
    return {
      oui: null,
      locallyAdministered: false,
      multicast: false,
      organization: null,
      match: 'bssid-redacted',
      registryFile: null,
    };
  }

  const oui = ouiFromBssid(bssid.value);
  const first = Number.parseInt(bssid.value.slice(0, 2), 16);
  const locallyAdministered = (first & 0x02) !== 0;
  const multicast = (first & 0x01) !== 0;

  if (locallyAdministered) {
    return {
      oui,
      locallyAdministered: true,
      multicast,
      organization: null,
      match: 'randomized',
      registryFile: null,
    };
  }

  const hit = lookup(oui);
  if (hit) {
    return {
      oui,
      locallyAdministered: false,
      multicast,
      organization: hit.organization,
      match: 'ieee-mal-24',
      registryFile: hit.registryFile,
    };
  }

  return {
    oui,
    locallyAdministered: false,
    multicast,
    organization: null,
    match: 'unknown',
    registryFile: null,
  };
}
