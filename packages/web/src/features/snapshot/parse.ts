import type { ObservedBss } from '@/domain/bss';
import type { RssiHistoryPoint } from '@/domain/timeseries';
import { bssidOfNetwork } from './bssidOf';
import { LV24_SCAN_APP_NAME, LV24_SCAN_FORMAT_VERSION, LV24_SCAN_KIND } from './constants';
import { isForeignScanFileName } from './fileName';
import type {
  Lv24PinnedColor,
  Lv24ScanDocument,
  Lv24ScanMetadata,
  Lv24ScanParseResult,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/** Hostile-input caps: snapshots are untrusted files, not IPC from our own main. */
const MAX_SNAPSHOT_CHARS = 25_000_000;
const MAX_NETWORKS = 10_000;
const MAX_HISTORY_POINTS = 2_000;
const MAX_HISTORY_ENTRIES = 20_000;
const MAX_ANNOTATIONS = 10_000;
const MAX_PINNED_COLORS = 10_000;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isGatedString(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.status === 'redacted') return true;
  return value.status === 'available' && typeof value.value === 'string';
}

function isSsidIdentity(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    (value.utf8 === null || typeof value.utf8 === 'string') &&
    Array.isArray(value.octets) &&
    value.octets.length <= 32 &&
    value.octets.every((byte) => typeof byte === 'number' && byte >= 0 && byte <= 255) &&
    typeof value.octetHex === 'string' &&
    typeof value.hidden === 'boolean' &&
    typeof value.displayName === 'string'
  );
}

function observedBssShapeError(value: unknown): string | null {
  if (!isRecord(value)) return 'not-object';
  const identity = value.identity;
  if (!isRecord(identity) || !isGatedString(identity.bssid)) return 'identity.bssid';
  if (!isRecord(identity.ssid)) return 'identity.ssid';
  if (identity.ssid.status === 'redacted') {
    if (identity.ssid.reason !== 'location-required') return 'identity.ssid.reason';
  } else if (identity.ssid.status !== 'available' || !isSsidIdentity(identity.ssid.value)) {
    return 'identity.ssid.value';
  }
  const signal = value.signal;
  if (
    !isRecord(signal) ||
    !isFiniteNumber(signal.rssiDbm) ||
    (signal.noiseDbm !== null && !isFiniteNumber(signal.noiseDbm)) ||
    (signal.snrDb !== null && !isFiniteNumber(signal.snrDb)) ||
    typeof signal.quality !== 'string'
  ) {
    return 'signal';
  }
  const channel = value.channel;
  if (
    !isRecord(channel) ||
    !isFiniteNumber(channel.number) ||
    (typeof channel.band !== 'string' && !isFiniteNumber(channel.band)) ||
    !('widthMhz' in channel)
  ) {
    return 'channel';
  }
  if (!isRecord(value.security) || typeof value.security.isOpen !== 'boolean') return 'security';
  if (!isRecord(value.phy) || !Array.isArray(value.phy.supported)) return 'phy';
  if (!isRecord(value.vendor)) return 'vendor';
  if (!isRecord(value.ie) || !Array.isArray(value.ie.presentIds)) return 'ie';
  if (
    !isRecord(value.presence) ||
    typeof value.presence.firstSeenAt !== 'string' ||
    typeof value.presence.lastSeenAt !== 'string' ||
    typeof value.presence.presence !== 'string'
  ) {
    return 'presence';
  }
  if (typeof value.ibss !== 'boolean') return 'ibss';
  if (!Array.isArray(value.rssiHistory)) return 'rssiHistory';
  if (!isRecord(value.lastRaw)) return 'lastRaw';
  if (
    value.lastRaw.informationElementData !== null &&
    !Array.isArray(value.lastRaw.informationElementData)
  ) {
    return 'lastRaw.ie';
  }
  return null;
}

function isObservedBssShape(value: unknown): value is ObservedBss {
  return observedBssShapeError(value) === null;
}

function looksForeign(value: Record<string, unknown>): boolean {
  const tokens = [value.kind, value.format, value.uti, value.extension, value.type]
    .filter((v) => typeof v === 'string')
    .map((v) => v.toLowerCase());
  return tokens.some((t) => t.includes('wifiexplorer'));
}

function asHistoryPoint(value: unknown): RssiHistoryPoint | null {
  if (!isRecord(value) || typeof value.at !== 'string' || typeof value.rssiDbm !== 'number') {
    return null;
  }
  return {
    at: value.at as RssiHistoryPoint['at'],
    rssiDbm: value.rssiDbm,
    noiseDbm: typeof value.noiseDbm === 'number' ? value.noiseDbm : null,
    snrDb: typeof value.snrDb === 'number' ? value.snrDb : null,
    channelNumber: typeof value.channelNumber === 'number' ? value.channelNumber : null,
  };
}

function asPinned(value: unknown): Lv24PinnedColor | null {
  if (!isRecord(value)) return null;
  if (typeof value.bssid !== 'string' || typeof value.color !== 'string') return null;
  return { bssid: value.bssid, color: value.color };
}

function asAnnotation(value: unknown): Lv24ScanDocument['annotations'][number] | null {
  if (!isRecord(value)) return null;
  if (typeof value.bssidPattern !== 'string') return null;
  return {
    id: typeof value.id === 'string' ? value.id : `ann-${value.bssidPattern}`,
    bssidPattern: value.bssidPattern,
    text: typeof value.text === 'string' ? value.text : '',
  };
}

function stitchHistory(
  networks: ObservedBss[],
  historyById: Record<string, RssiHistoryPoint[]>
): ObservedBss[] {
  return networks.map((bss) => {
    const id = bssidOfNetwork(bss);
    if (!id) return bss;
    if (bss.rssiHistory && bss.rssiHistory.length > 0) return bss;
    const hist = historyById[id];
    if (!hist?.length) return bss;
    return { ...bss, rssiHistory: hist };
  });
}

function parseMetadata(value: unknown): Lv24ScanMetadata | null {
  if (!isRecord(value) || typeof value.appVersion !== 'string') return null;
  return {
    appName: LV24_SCAN_APP_NAME,
    appVersion: value.appVersion,
    os: typeof value.os === 'string' ? value.os : null,
    capturedAt: typeof value.capturedAt === 'string' ? value.capturedAt : new Date(0).toISOString(),
    endedAt: typeof value.endedAt === 'string' ? value.endedAt : null,
    interfaceName: typeof value.interfaceName === 'string' ? value.interfaceName : null,
    scanIntervalMs: typeof value.scanIntervalMs === 'number' ? value.scanIntervalMs : null,
    location:
      value.location === 'granted' ||
      value.location === 'denied' ||
      value.location === 'not-determined' ||
      value.location === 'restricted'
        ? value.location
        : null,
  };
}

export function parseLv24Scan(text: string, fileName?: string): Lv24ScanParseResult {
  if (fileName && isForeignScanFileName(fileName)) {
    return {
      ok: false,
      code: 'foreign-format',
      error: 'This file uses a third-party scan format. Open a .lv24scan snapshot.',
    };
  }

  if (text.length > MAX_SNAPSHOT_CHARS) {
    return {
      ok: false,
      code: 'invalid-document',
      error: 'Snapshot is too large to open safely.',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, code: 'invalid-json', error: 'Snapshot is not valid JSON.' };
  }

  if (!isRecord(parsed)) {
    return { ok: false, code: 'invalid-document', error: 'Snapshot root must be an object.' };
  }

  if (looksForeign(parsed)) {
    return {
      ok: false,
      code: 'foreign-format',
      error: 'This file uses a third-party scan format. Open a .lv24scan snapshot.',
    };
  }

  if (parsed.kind !== LV24_SCAN_KIND) {
    return {
      ok: false,
      code: 'unsupported-format',
      error: 'Not an LV24 scan snapshot (missing kind lv24.wifi-explorer.scan).',
    };
  }

  if (parsed.formatVersion !== LV24_SCAN_FORMAT_VERSION) {
    return {
      ok: false,
      code: 'unsupported-format',
      error: `Unsupported .lv24scan formatVersion (${String(parsed.formatVersion)}).`,
    };
  }

  const metadata = parseMetadata(parsed.metadata);
  if (!metadata) {
    return { ok: false, code: 'invalid-document', error: 'Snapshot metadata is incomplete.' };
  }

  if (!Array.isArray(parsed.networks)) {
    return { ok: false, code: 'invalid-document', error: 'Snapshot networks must be an array.' };
  }
  if (parsed.networks.length > MAX_NETWORKS) {
    return {
      ok: false,
      code: 'invalid-document',
      error: `Snapshot contains too many networks (max ${MAX_NETWORKS}).`,
    };
  }
  for (let index = 0; index < parsed.networks.length; index += 1) {
    if (!isObservedBssShape(parsed.networks[index])) {
      return {
        ok: false,
        code: 'invalid-document',
        error: `Snapshot network #${index + 1} is malformed (${observedBssShapeError(parsed.networks[index]) ?? 'unknown'}).`,
      };
    }
  }

  const networks = parsed.networks as ObservedBss[];
  const historyById: Record<string, RssiHistoryPoint[]> = {};
  if (isRecord(parsed.historyById)) {
    let entries = 0;
    for (const [key, points] of Object.entries(parsed.historyById)) {
      if (!Array.isArray(points)) continue;
      entries += 1;
      if (entries > MAX_HISTORY_ENTRIES) break;
      historyById[key] = points
        .slice(0, MAX_HISTORY_POINTS)
        .map(asHistoryPoint)
        .filter((p): p is RssiHistoryPoint => p != null);
    }
  }

  const annotations = Array.isArray(parsed.annotations)
    ? parsed.annotations
        .slice(0, MAX_ANNOTATIONS)
        .map(asAnnotation)
        .filter((a): a is NonNullable<typeof a> => a != null)
    : [];
  const pinnedColors = Array.isArray(parsed.pinnedColors)
    ? parsed.pinnedColors
        .slice(0, MAX_PINNED_COLORS)
        .map(asPinned)
        .filter((p): p is Lv24PinnedColor => p != null)
    : [];

  const document: Lv24ScanDocument = {
    kind: LV24_SCAN_KIND,
    formatVersion: LV24_SCAN_FORMAT_VERSION,
    metadata,
    networks: stitchHistory(networks, historyById),
    historyById,
    annotations,
    pinnedColors,
  };

  return { ok: true, document };
}
