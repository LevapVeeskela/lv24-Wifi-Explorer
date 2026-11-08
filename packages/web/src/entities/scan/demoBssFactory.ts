import type { ObservedBss } from '@/domain/bss';
import type { Bssid, IsoTime, SsidOctetHex } from '@/domain/identity';
import type { BandGhz, ChannelWidthMhz } from '@/domain/channel';
import type { PhyLetter } from '@/domain/phy';
import type { SecurityKind } from '@/domain/security';
import type { SignalQuality } from '@/domain/signal';

type DemoBssInput = {
  bssid: string;
  ssid: string;
  hidden?: boolean;
  vendor: string;
  oui: string;
  rssiDbm: number;
  noiseDbm: number;
  channel: number;
  band: BandGhz;
  widthMhz: ChannelWidthMhz;
  phy: readonly PhyLetter[];
  security: SecurityKind;
  ibss?: boolean;
  maxRateMbps?: number;
};

function isoNow(offsetMinutes = 0): IsoTime {
  const d = new Date(Date.now() - offsetMinutes * 60_000);
  return d.toISOString() as IsoTime;
}

function qualityFromSnr(snrDb: number | null, rssiDbm: number): SignalQuality {
  if (snrDb != null) {
    if (snrDb >= 40) return 'excellent';
    if (snrDb >= 25) return 'good';
    if (snrDb >= 15) return 'fair';
    if (snrDb >= 10) return 'poor';
    return 'unusable';
  }
  if (rssiDbm >= -50) return 'excellent';
  if (rssiDbm >= -60) return 'good';
  if (rssiDbm >= -70) return 'fair';
  if (rssiDbm >= -80) return 'poor';
  return 'unusable';
}

function securityView(primary: SecurityKind) {
  const isOpen = primary === 'open';
  const isSecure = !isOpen;
  let authClass: 'open' | 'personal' | 'enterprise' | 'enhanced-open' | 'unknown' = 'unknown';
  if (isOpen) authClass = 'open';
  else if (primary === 'owe') authClass = 'enhanced-open';
  else if (primary.includes('enterprise')) authClass = 'enterprise';
  else authClass = 'personal';

  return {
    flags: [primary] as readonly SecurityKind[],
    primary,
    authClass,
    isOpen,
    isSecure,
    ieHint: 'none' as const,
  };
}

export function buildDemoBss(input: DemoBssInput): ObservedBss {
  const snrDb =
    input.noiseDbm != null && Number.isFinite(input.noiseDbm)
      ? input.rssiDbm - input.noiseDbm
      : null;
  const seen = isoNow(0);
  const bssid = input.bssid as Bssid;
  const ssidOctets = [...new TextEncoder().encode(input.ssid)];
  const octetHex = ssidOctets.map((b) => b.toString(16).padStart(2, '0')).join('') as SsidOctetHex;

  return {
    identity: {
      bssid: { status: 'available', value: bssid },
      ssid: {
        status: 'available',
        value: {
          utf8: input.hidden ? null : input.ssid,
          octets: ssidOctets,
          octetHex,
          hidden: Boolean(input.hidden),
          displayName: input.hidden ? '' : input.ssid,
        },
      },
    },
    ibss: input.ibss ?? false,
    countryCode: { status: 'available', value: 'RU' },
    beaconIntervalMs: 100,
    signal: {
      rssiDbm: input.rssiDbm,
      noiseDbm: input.noiseDbm,
      snrDb,
      quality: qualityFromSnr(snrDb, input.rssiDbm),
      qualityBasis: snrDb != null ? 'snr' : 'rssi-fallback',
    },
    channel: {
      number: input.channel,
      band: input.band,
      widthMhz: input.widthMhz,
      primaryCenterMhz: input.band === 2.4 ? 2407 + 5 * input.channel : 5000 + 5 * input.channel,
      occupyingCenterMhz: input.band === 2.4 ? 2407 + 5 * input.channel : 5000 + 5 * input.channel,
      occupyingSpanMhz: { from: 0, to: input.widthMhz },
      centerConfidence: 'ieee-primary-20',
    },
    security: securityView(input.security),
    phy: {
      supported: input.phy,
      highest: input.phy[input.phy.length - 1] ?? null,
      display: input.phy.join('/') as ObservedBss['phy']['display'],
      source: 'api-supportsPHYMode',
    },
    maxRate: input.maxRateMbps
      ? {
          mbpsLow: input.maxRateMbps,
          mbpsHigh: null,
          basis: 'phy-width-1ss-long-gi',
          nssUsed: 1,
          disclaimer: 'not-a-link-speed',
        }
      : null,
    vendor: {
      oui: input.oui as ObservedBss['vendor']['oui'],
      locallyAdministered: false,
      multicast: false,
      organization: input.vendor,
      match: 'ieee-mal-24',
      registryFile: 'oui/ieee-mal.txt',
    },
    ie: {
      level: 'shallow-tags',
      byteLength: 128,
      presentIds: [0, 1, 48],
      wpaVendorIe: false,
      rsnIe: true,
      htCapabilities: true,
      vhtCapabilities: input.phy.includes('ac'),
      heCapabilities: input.phy.includes('ax'),
      ehtCapabilities: false,
      countryFromIe: 'RU',
      nssHint: 2,
      htPrimaryChannel: input.channel,
      htSecondaryOffset: 0,
      ccfs0: input.channel,
    },
    presence: {
      firstSeenAt: isoNow(30),
      lastSeenAt: seen,
      lastMissingAt: null,
      consecutiveMisses: 0,
      presence: 'current',
    },
    rssiHistory: [
      {
        at: isoNow(5),
        rssiDbm: input.rssiDbm - 2,
        noiseDbm: input.noiseDbm,
        snrDb: snrDb != null ? snrDb - 2 : null,
        channelNumber: input.channel,
      },
      {
        at: seen,
        rssiDbm: input.rssiDbm,
        noiseDbm: input.noiseDbm,
        snrDb,
        channelNumber: input.channel,
      },
    ],
    lastRaw: {
      ssid: input.hidden ? null : input.ssid,
      ssidData: ssidOctets,
      bssid: input.bssid,
      rssiDbm: input.rssiDbm,
      noiseDbm: input.noiseDbm,
      channelNumber: input.channel,
      channelBand: input.band === 2.4 ? '2ghz' : input.band === 5 ? '5ghz' : '6ghz',
      channelWidth: `${input.widthMhz}mhz` as ObservedBss['lastRaw']['channelWidth'],
      countryCode: 'RU',
      beaconIntervalMs: 100,
      ibss: input.ibss ?? false,
      informationElementData: null,
      supportedSecurity: [input.security],
      supportedPhyModes: [...input.phy],
    },
  };
}
