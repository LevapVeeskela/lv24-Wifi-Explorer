import type { ObservedBss } from '../../domain/bss';
import type { RssiHistoryPoint } from '../../domain/timeseries';
import { bssidOfNetwork } from './bssidOf';
import {
  LV24_SCAN_APP_NAME,
  LV24_SCAN_FORMAT_VERSION,
  LV24_SCAN_KIND,
} from './constants';
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

  const networks = parsed.networks as ObservedBss[];
  const historyById: Record<string, RssiHistoryPoint[]> = {};
  if (isRecord(parsed.historyById)) {
    for (const [key, points] of Object.entries(parsed.historyById)) {
      if (!Array.isArray(points)) continue;
      historyById[key] = points.map(asHistoryPoint).filter((p): p is RssiHistoryPoint => p != null);
    }
  }

  const annotations = Array.isArray(parsed.annotations)
    ? parsed.annotations.map(asAnnotation).filter((a): a is NonNullable<typeof a> => a != null)
    : [];
  const pinnedColors = Array.isArray(parsed.pinnedColors)
    ? parsed.pinnedColors.map(asPinned).filter((p): p is Lv24PinnedColor => p != null)
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
