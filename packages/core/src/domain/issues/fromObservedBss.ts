import type { ObservedBss } from '../bss';
import type { ScanIssueBss } from './types';

function hiddenFromIdentity(bss: ObservedBss): boolean {
  if (bss.identity.ssid.status !== 'available') return false;
  return bss.identity.ssid.value.hidden;
}

function countryFromBss(bss: ObservedBss): string | null {
  if (bss.countryCode.status !== 'available') return null;
  return bss.countryCode.value;
}

/** Map domain scan row to issue heuristics input. */
export function scanIssueBssFromObserved(bss: ObservedBss): ScanIssueBss {
  const bssid = bss.identity.bssid.status === 'available' ? bss.identity.bssid.value : null;
  const ssid =
    bss.identity.ssid.status === 'available'
      ? (bss.identity.ssid.value.utf8 ?? bss.identity.ssid.value.displayName)
      : null;
  return {
    bssid,
    ssid,
    channel: {
      band: bss.channel.band,
      number: bss.channel.number,
      widthMhz: bss.channel.widthMhz,
    },
    signal: {
      rssiDbm: bss.signal.rssiDbm,
      snrDb: bss.signal.snrDb,
    },
    security: {
      primary: bss.security.primary,
      isOpen: bss.security.isOpen,
    },
    hiddenSsid: hiddenFromIdentity(bss),
    phy: {
      highest: bss.phy.highest,
      supported: bss.phy.supported,
    },
    countryCode: countryFromBss(bss),
  };
}
