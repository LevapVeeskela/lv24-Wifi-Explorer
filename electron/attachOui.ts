import { pathToFileURL } from 'node:url';
import * as path from 'node:path';
import { app } from 'electron';

type VendorView = {
  oui: string | null;
  organization: string | null;
};

/**
 * Node-only IEEE MA-L. Renderer must not import load-registry (fs).
 * Attaches a small prefix map for BSSIDs in this snapshot.
 */
export async function attachOuiByPrefix(
  networks: unknown,
): Promise<Record<string, string>> {
  if (!Array.isArray(networks)) return {};
  try {
    const vendorDir = path.join(app.getAppPath(), 'src/vendor');
    const loadUrl = pathToFileURL(path.join(vendorDir, 'load-registry.mjs')).href;
    const lookupUrl = pathToFileURL(path.join(vendorDir, 'lookup.mjs')).href;
    const { loadOuiRegistry } = (await import(loadUrl)) as {
      loadOuiRegistry: () => unknown;
    };
    const { lookupVendor } = (await import(lookupUrl)) as {
      lookupVendor: (bssid: string) => VendorView;
    };
    loadOuiRegistry();
    const map: Record<string, string> = {};
    for (const row of networks) {
      if (!row || typeof row !== 'object') continue;
      const bssid = (row as { bssid?: unknown }).bssid;
      if (typeof bssid !== 'string') continue;
      const view = lookupVendor(bssid);
      if (view.oui && view.organization) {
        map[view.oui] = view.organization;
      }
    }
    return map;
  } catch {
    return {};
  }
}
