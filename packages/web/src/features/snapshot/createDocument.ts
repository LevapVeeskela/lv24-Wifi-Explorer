import type { ObservedBss } from '@/domain/bss';
import type { RssiHistoryPoint } from '@/domain/timeseries';
import { bssidOfNetwork } from './bssidOf';
import { LV24_SCAN_APP_NAME, LV24_SCAN_FORMAT_VERSION, LV24_SCAN_KIND } from './constants';
import type { CreateLv24ScanInput, Lv24ScanDocument } from './types';

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function historyByIdFrom(networks: readonly ObservedBss[]): Record<string, RssiHistoryPoint[]> {
  const out: Record<string, RssiHistoryPoint[]> = {};
  for (const bss of networks) {
    const id = bssidOfNetwork(bss);
    if (!id) continue;
    out[id] = cloneJson([...(bss.rssiHistory ?? [])]);
  }
  return out;
}

export function createLv24ScanDocument(input: CreateLv24ScanInput): Lv24ScanDocument {
  const networks = cloneJson([...input.networks]);
  return {
    kind: LV24_SCAN_KIND,
    formatVersion: LV24_SCAN_FORMAT_VERSION,
    metadata: {
      appName: LV24_SCAN_APP_NAME,
      appVersion: input.appVersion,
      os: input.os ?? null,
      capturedAt: input.capturedAt ?? new Date().toISOString(),
      endedAt: input.endedAt ?? null,
      interfaceName: input.interfaceName ?? null,
      scanIntervalMs: input.scanIntervalMs ?? null,
      location: input.location ?? null,
    },
    networks,
    historyById: historyByIdFrom(networks),
    annotations: cloneJson([...(input.annotations ?? [])]),
    pinnedColors: cloneJson([...(input.pinnedColors ?? [])]),
  };
}
