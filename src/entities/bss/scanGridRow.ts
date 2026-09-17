import type { ObservedBss } from '@/domain/bss';
import type { MessageKey } from '@/shared/i18n';
import { bssidRowId, normalizeBssid } from './normalizeBssid';
import { seriesColorForBssid } from './seriesColor';

export type ScanGridRow = {
  id: string;
  bssid: string;
  ssid: string;
  ssidHidden: boolean;
  vendor: string | null;
  annotation: string;
  signalQuality: ObservedBss['signal']['quality'];
  signalBarPct: number;
  rssiDbm: number;
  noiseDbm: number | null;
  snrDb: number | null;
  channel: number;
  channelWidth: number | 'unknown';
  band: number | 'unknown';
  phyMode: string;
  securityLabel: string;
  securityOpen: boolean;
  networkType: 'infrastructure' | 'ibss';
  lastSeenAt: string;
  seriesColor: string;
  connected: boolean;
  stale: boolean;
  issueKeys: MessageKey[];
  source: ObservedBss;
};

function rssiBar(rssiDbm: number): number {
  const clamped = Math.min(-30, Math.max(-100, rssiDbm));
  return Math.round(((clamped + 100) / 70) * 100);
}

export function observedBssToGridRow(
  bss: ObservedBss,
  options: {
    annotation?: string;
    connectedBssid?: string | null;
  } = {}
): ScanGridRow | null {
  const bssidRaw =
    bss.identity.bssid.status === 'available' ? bss.identity.bssid.value : null;
  const bssid = normalizeBssid(bssidRaw);
  if (!bssid) return null;

  const ssidIdentity =
    bss.identity.ssid.status === 'available' ? bss.identity.ssid.value : null;
  const hidden = ssidIdentity?.hidden ?? false;
  const ssid = hidden ? '' : (ssidIdentity?.displayName ?? ssidIdentity?.utf8 ?? '');

  return {
    id: bssidRowId(bssid),
    bssid,
    ssid,
    ssidHidden: hidden,
    vendor: bss.vendor.organization,
    annotation: options.annotation ?? '',
    signalQuality: bss.signal.quality,
    signalBarPct: rssiBar(bss.signal.rssiDbm),
    rssiDbm: bss.signal.rssiDbm,
    noiseDbm: bss.signal.noiseDbm,
    snrDb: bss.signal.snrDb,
    channel: bss.channel.number,
    channelWidth: bss.channel.widthMhz,
    band: bss.channel.band,
    phyMode: bss.phy.display || '—',
    securityLabel: bss.security.primary,
    securityOpen: bss.security.isOpen,
    networkType: bss.ibss ? 'ibss' : 'infrastructure',
    lastSeenAt: bss.presence.lastSeenAt,
    seriesColor: seriesColorForBssid(bssid),
    connected: normalizeBssid(options.connectedBssid) === bssid,
    stale: bss.presence.presence === 'stale',
    issueKeys: [],
    source: bss,
  };
}
