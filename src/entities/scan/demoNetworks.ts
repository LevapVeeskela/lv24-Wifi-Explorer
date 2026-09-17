import { buildDemoView, DEMO_CONNECTED_BSSID as SCAN_CONNECTED_BSSID } from '@/scan';

/**
 * UI demo = mapper fixtures (один источник).
 * IEEE OUI подключается через options.ouiLookup в Electron main, не здесь.
 */
const demoView = buildDemoView();

export const DEMO_OBSERVED_BSS = demoView.bssRows;
export const DEMO_CONNECTED_BSSID = SCAN_CONNECTED_BSSID;
