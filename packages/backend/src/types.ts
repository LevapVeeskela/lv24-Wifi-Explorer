import type { AssociatedLink, CoreWlanNetworkRecord, LocationAuthorization } from '@lv24/wifi-core';

export type ScanProviderId = 'auto' | 'demo' | 'macos-scancore' | 'linux-nmcli' | 'windows-netsh';

export type ScanSource = 'scancore' | 'nmcli' | 'netsh' | 'fixtures';

export type ScanSnapshotPayload = {
  capturedAt: string;
  interfaceName: string | null;
  location: LocationAuthorization;
  networks: CoreWlanNetworkRecord[];
  associated: AssociatedLink | null;
  includeHiddenRequested: boolean;
  source: ScanSource;
  demo: boolean;
};

export type ScanProviderError = {
  code: string;
  message: string;
  recoverable: boolean;
  demoFallback?: boolean;
};

export type ScanProviderEvent =
  | { type: 'snapshot'; payload: ScanSnapshotPayload }
  | { type: 'permissions'; location: LocationAuthorization; demo: boolean }
  | { type: 'status'; running: boolean; scanning: boolean; helper?: string }
  | { type: 'error'; error: ScanProviderError };

export type ScanProviderOptions = {
  intervalMs: number;
  includeHidden: boolean;
  /**
   * Directed scan target: probe only this SSID (`scanForNetworks(withName:)`).
   * macOS only — `linux-nmcli`, `windows-netsh` and `demo` ignore it and emit a
   * recoverable `DIRECTED_SSID_UNSUPPORTED` note. Omit for a full active scan.
   */
  directedSsid?: string;
  /** Optional helper binary (macOS) or command override (nmcli/netsh). */
  binaryPath?: string;
  /** Deterministic demo fixtures for tests. */
  fixtureNetworks?: readonly CoreWlanNetworkRecord[];
};

export interface ScanProvider {
  readonly id: Exclude<ScanProviderId, 'auto'>;
  readonly platform: NodeJS.Platform;
  start(options: ScanProviderOptions): Promise<void>;
  stop(): Promise<void>;
  /** Ask the native layer to re-check permissions (macOS). */
  requestPermissions?(): void;
  /** Update the poll/scan interval without restarting. */
  setIntervalMs?(intervalMs: number): void;
  onEvent(listener: (event: ScanProviderEvent) => void): () => void;
}

export function isoNow(): string {
  return new Date().toISOString();
}

/** Quality percent (0–100) → documented RSSI approximation (−100…−50 dBm). */
export function rssiFromQualityPercent(percent: number): number {
  const clamped = Math.min(100, Math.max(0, percent));
  return Math.round(-100 + clamped / 2);
}

/** IEEE channel → reference frequency (MHz). 6 GHz uses the 5950+5n rule. */
export function frequencyMhzForChannel(channel: number, band: '2.4' | '5' | '6'): number {
  if (band === '2.4') return channel === 14 ? 2484 : 2407 + 5 * channel;
  if (band === '6') return 5950 + 5 * channel;
  return 5000 + 5 * channel;
}

export function bandForChannel(channel: number): '2.4' | '5' | '6' {
  if (channel <= 14) return '2.4';
  if (channel >= 233) return '6';
  return '5';
}
