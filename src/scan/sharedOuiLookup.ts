import type { Oui24 } from '../domain/identity';
import { lookupOrganizationByPrefix } from '../shared/lib/oui';

import type { OuiLookup } from './vendorStub';

const REGISTRY_FILE = 'resources/oui/registry.json';

/** Bundled IEEE MA-L registry (`resources/oui/registry.json`) for scan mappers. */
export const SHARED_OUI_LOOKUP: OuiLookup = (oui: Oui24) => {
  const organization = lookupOrganizationByPrefix(oui);
  if (!organization) {
    return null;
  }
  return { organization, registryFile: REGISTRY_FILE };
};
