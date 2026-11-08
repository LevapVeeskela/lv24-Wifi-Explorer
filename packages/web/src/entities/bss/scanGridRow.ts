import type { ObservedBss } from '@/domain/bss';
import type { PhyLetter } from '@/domain/phy';
import type { MessageKey } from '@/shared/i18n';
import { bssMatchKey } from '@/scan/identity';
import { bssidRowId, normalizeBssid } from './normalizeBssid';
import { seriesColorForBssid } from './seriesColor';

export type ScanGridRow = {
  id: string;
  bssid: string;
  ssid: string;
  ssidHidden: boolean;
  vendor: string | null;
  /**
   * WPS Device Name (vendor IE 221) — реальное имя, заявленное точкой.
   * null, если WPS-атрибута нет; из vendor/BSSID не подставляем.
   */
  apName: string | null;
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
  firstSeenAt: string | null;
  /** Секунды между firstSeenAt и `options.now`; null если время невалидно. */
  uptimeSec: number | null;
  centerFreqMhz: number | null;
  maxRateMbps: number | null;
  /** NSS из IE (HT/VHT/HE/EHT MCS map). */
  streams: number | null;
  /** Заявленные `supportsPHYMode` — честный список, не строка. */
  amendments: string[];
  /** Поколение Wi-Fi из highest PHY (b→1 … be→7); null если PHY неизвестен. */
  generation: string | null;
  countryCode: string | null;
  beaconIntervalMs: number | null;
  dtimPeriod: number | null;
  bssLoadStations: number | null;
  bssLoadUtilPct: number | null;
  channelUtilPct: number | null;
  ieCount: number | null;
  ieBytes: number | null;
  wps: boolean | null;
  mfp: boolean | null;
  ft: boolean | null;
  seriesColor: string;
  connected: boolean;
  stale: boolean;
  issueKeys: MessageKey[];
  source: ObservedBss;
};

/** PHY letter → поколение Wi-Fi (IEEE amendment family). */
const PHY_GENERATION: Record<PhyLetter, string> = {
  b: 'Wi-Fi 1',
  a: 'Wi-Fi 2',
  g: 'Wi-Fi 3',
  n: 'Wi-Fi 4',
  ac: 'Wi-Fi 5',
  ax: 'Wi-Fi 6',
  be: 'Wi-Fi 7',
};

function generationOf(highest: PhyLetter | null): string | null {
  return highest == null ? null : (PHY_GENERATION[highest] ?? null);
}

function uptimeSeconds(firstSeenAt: string, now: number): number | null {
  const first = new Date(firstSeenAt).getTime();
  if (!Number.isFinite(first) || !Number.isFinite(now)) return null;
  return Math.max(0, Math.round((now - first) / 1000));
}

function rssiBar(rssiDbm: number): number {
  const clamped = Math.min(-30, Math.max(-100, rssiDbm));
  return Math.round(((clamped + 100) / 70) * 100);
}

/** Grid + filters: hidden SSID rows (empty octets or explicit hidden flag). */
export function ssidHiddenFromBss(bss: ObservedBss): boolean {
  if (bss.identity.ssid.status !== 'available') return false;
  const id = bss.identity.ssid.value;
  return id.hidden || id.octets.length === 0;
}

/** SSID column label: hidden placeholder or visible name (em dash if empty). */
export function ssidGridLabel(
  row: Pick<ScanGridRow, 'ssidHidden' | 'ssid'>,
  hiddenPlaceholder: string
): string {
  if (row.ssidHidden) return hiddenPlaceholder;
  const text = row.ssid.trim();
  return text || '—';
}

export function observedBssToGridRow(
  bss: ObservedBss,
  options: {
    annotation?: string;
    connectedBssid?: string | null;
    /** Момент для uptime; по умолчанию Date.now(). */
    now?: number;
  } = {}
): ScanGridRow | null {
  const bssidRaw = bss.identity.bssid.status === 'available' ? bss.identity.bssid.value : null;
  // Location can redact BSSID/SSID; keep the row with the stable match key
  // so RF-only scans remain usable instead of disappearing from the grid.
  const bssidKey = bssMatchKey(bss);
  const normalized = normalizeBssid(bssidRaw);
  const bssid = normalized ?? bssidKey;
  const displayBssid = normalized ?? '—';

  const ssidIdentity = bss.identity.ssid.status === 'available' ? bss.identity.ssid.value : null;
  const hidden = ssidHiddenFromBss(bss);
  const ssid = hidden ? '' : (ssidIdentity?.utf8 ?? ssidIdentity?.displayName ?? '').trim();

  const ie = bss.ie;
  const ieParsed = ie.level === 'shallow-tags';
  const now = options.now ?? Date.now();
  const firstSeenAt = bss.presence.firstSeenAt;
  const countryFromApi = bss.countryCode.status === 'available' ? bss.countryCode.value : null;
  const rsnKnown = ie.rsnIe != null ? ie.rsnIe : false;

  return {
    id: bssidRowId(bssid),
    bssid: displayBssid,
    ssid,
    ssidHidden: hidden,
    vendor: bss.vendor.organization,
    apName: ieParsed ? (ie.wpsDeviceName ?? null) : null,
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
    firstSeenAt: firstSeenAt || null,
    uptimeSec: firstSeenAt ? uptimeSeconds(firstSeenAt, now) : null,
    centerFreqMhz: bss.channel.occupyingCenterMhz ?? bss.channel.primaryCenterMhz,
    maxRateMbps: bss.maxRate?.mbpsLow ?? null,
    streams: ie.nssHint ?? null,
    amendments: [...bss.phy.supported],
    generation: generationOf(bss.phy.highest),
    countryCode: countryFromApi ?? ie.countryFromIe ?? null,
    beaconIntervalMs: (bss.lastRaw.beaconIntervalMs ?? 0) > 0 ? bss.lastRaw.beaconIntervalMs : null,
    dtimPeriod: ie.dtimPeriod ?? null,
    bssLoadStations: ie.bssLoadStations ?? null,
    bssLoadUtilPct: ie.bssLoadUtilPct ?? null,
    channelUtilPct: ie.bssLoadUtilPct ?? null,
    ieCount: ieParsed ? ie.presentIds.length : null,
    ieBytes: ie.byteLength > 0 ? ie.byteLength : null,
    wps: ieParsed ? ie.wps === true : null,
    mfp: ieParsed ? ie.mfpCapable === true || ie.mfpRequired === true : rsnKnown ? false : null,
    ft: ieParsed ? ie.mobilityDomain === true : null,
    seriesColor: seriesColorForBssid(bssid),
    connected: normalizeBssid(options.connectedBssid) === bssid,
    stale: bss.presence.presence === 'stale',
    issueKeys: [],
    source: bss,
  };
}
