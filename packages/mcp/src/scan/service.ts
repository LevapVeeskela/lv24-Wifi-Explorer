/**
 * ScanService — one shared scan pipeline for all MCP tools.
 *
 * - serializes scans so two tool calls never start two ScanCore processes;
 * - caches the last snapshot (30 s TTL) and the mapped `ObservedBss` rows;
 * - maps raw CoreWLAN records through `@lv24/wifi-core`.
 */

import {
  asIsoTime,
  type AssociatedLink,
  type LocationAuthorization,
  type ObservedBss,
} from '@lv24/wifi-core';
import { mapCoreWlanRecordsToObservedBss, type OuiLookup } from '@lv24/wifi-core/scan';
import {
  createScanProvider,
  type CreateScanProviderOptions,
  type ScanProvider,
  type ScanProviderId,
  type ScanSnapshotPayload,
  type ScanSource,
} from '@lv24/wifi-backend';
import { loadOuiLookup } from './oui.js';

export const DEFAULT_INTERVAL_MS = 3000;
export const DEFAULT_TIMEOUT_MS = 15000;
export const DEFAULT_CACHE_TTL_MS = 30_000;

export type ScanRequestOptions = {
  provider?: ScanProviderId;
  directedSsid?: string;
  includeHidden?: boolean;
  intervalMs?: number;
  timeoutMs?: number;
  /** Helper binary override (macOS ScanCore). Defaults to `LV24_SCANCORE_PATH`. */
  binaryPath?: string;
};

export type ScanSnapshot = {
  provider: ScanProvider['id'];
  source: ScanSource;
  demo: boolean;
  capturedAt: string;
  interfaceName: string | null;
  location: LocationAuthorization;
  associated: AssociatedLink | null;
  rows: ObservedBss[];
};

export type ScanServiceDeps = {
  createProvider?: (options: CreateScanProviderOptions) => ScanProvider;
  now?: () => number;
  /** `null` disables vendor lookup; `undefined` lazily loads the IEEE CSV. */
  ouiLookup?: OuiLookup | null;
  cacheTtlMs?: number;
};

export type GetSnapshotOptions = {
  refresh?: boolean;
};

/** Scan failure with a client-safe message (no native stack traces). */
export class ScanServiceError extends Error {
  constructor(
    message: string,
    readonly code: string = 'scan_failed'
  ) {
    super(message);
    this.name = 'ScanServiceError';
  }
}

type CacheEntry = {
  snapshot: ScanSnapshot;
  atMs: number;
  options: ScanRequestOptions;
};

function clampInterval(value: number | undefined): number {
  if (!Number.isFinite(value ?? Number.NaN)) return DEFAULT_INTERVAL_MS;
  return Math.min(600_000, Math.max(500, Math.floor(value as number)));
}

function clampTimeout(value: number | undefined): number {
  if (!Number.isFinite(value ?? Number.NaN)) return DEFAULT_TIMEOUT_MS;
  return Math.min(120_000, Math.max(500, Math.floor(value as number)));
}

export class ScanService {
  private readonly createProvider: (options: CreateScanProviderOptions) => ScanProvider;
  private readonly now: () => number;
  private readonly cacheTtlMs: number;
  private readonly ouiLookupOverride: OuiLookup | null | undefined;

  private queue: Promise<unknown> = Promise.resolve();
  private cache: CacheEntry | null = null;
  private lastOptions: ScanRequestOptions = {};

  constructor(deps: ScanServiceDeps = {}) {
    this.createProvider = deps.createProvider ?? createScanProvider;
    this.now = deps.now ?? Date.now;
    this.cacheTtlMs = deps.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    this.ouiLookupOverride = deps.ouiLookup;
  }

  /** Run one scan (serialized with every other in-flight scan). */
  async scan(options: ScanRequestOptions = {}): Promise<ScanSnapshot> {
    const run = this.queue.then(() => this.runScan(options));
    // Keep the queue alive on failure without swallowing the caller's error.
    this.queue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  /**
   * Cached snapshot, or a fresh scan when `refresh` is set / the cache is stale.
   * A refresh reuses the options of the previous scan (e.g. `demo` stays demo).
   */
  async getSnapshot(options: GetSnapshotOptions = {}): Promise<ScanSnapshot> {
    if (!options.refresh && this.cache && this.now() - this.cache.atMs < this.cacheTtlMs) {
      return this.cache.snapshot;
    }
    const request = options.refresh ? this.lastOptions : {};
    return this.scan(request);
  }

  /** Last cached snapshot without touching the radio. */
  peekSnapshot(): ScanSnapshot | null {
    return this.cache?.snapshot ?? null;
  }

  clearCache(): void {
    this.cache = null;
  }

  private resolveOuiLookup(): OuiLookup | undefined {
    if (this.ouiLookupOverride === null) return undefined;
    if (this.ouiLookupOverride) return this.ouiLookupOverride;
    return loadOuiLookup() ?? undefined;
  }

  private async runScan(options: ScanRequestOptions): Promise<ScanSnapshot> {
    const provider = this.createProvider({
      provider: options.provider ?? 'auto',
      binaryPath: options.binaryPath ?? process.env.LV24_SCANCORE_PATH,
    });
    try {
      const payload = await this.collectFirstSnapshot(provider, options);
      const capturedAt = asIsoTime(payload.capturedAt);
      const rows = mapCoreWlanRecordsToObservedBss(payload.networks, undefined, capturedAt, {
        location: payload.location,
        ouiLookup: this.resolveOuiLookup(),
      });
      const snapshot: ScanSnapshot = {
        provider: provider.id,
        source: payload.source,
        demo: payload.demo,
        capturedAt,
        interfaceName: payload.interfaceName,
        location: payload.location,
        associated: payload.associated,
        rows,
      };
      this.cache = { snapshot, atMs: this.now(), options: { ...options } };
      this.lastOptions = { ...options };
      return snapshot;
    } finally {
      try {
        await provider.stop();
      } catch {
        // A failing stop must not mask the scan result/error.
      }
    }
  }

  private collectFirstSnapshot(
    provider: ScanProvider,
    options: ScanRequestOptions
  ): Promise<ScanSnapshotPayload> {
    const timeoutMs = clampTimeout(options.timeoutMs);
    return new Promise<ScanSnapshotPayload>((resolve, reject) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      let unsubscribe: () => void = () => undefined;

      const finish = (error: Error | null, payload?: ScanSnapshotPayload): void => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        unsubscribe();
        if (error) reject(error);
        else resolve(payload as ScanSnapshotPayload);
      };

      unsubscribe = provider.onEvent((event) => {
        if (event.type === 'snapshot') {
          finish(null, event.payload);
          return;
        }
        if (event.type === 'error' && !event.error.recoverable) {
          finish(new ScanServiceError(event.error.message, event.error.code));
        }
      });

      timer = setTimeout(() => {
        finish(
          new ScanServiceError(
            `No Wi-Fi snapshot within ${timeoutMs} ms (provider: ${provider.id}).`,
            'scan_timeout'
          )
        );
      }, timeoutMs);

      provider
        .start({
          intervalMs: clampInterval(options.intervalMs),
          includeHidden: options.includeHidden ?? true,
          directedSsid: options.directedSsid,
          binaryPath: options.binaryPath,
        })
        .catch((error: unknown) => {
          finish(
            error instanceof ScanServiceError
              ? error
              : new ScanServiceError(
                  error instanceof Error ? error.message : 'Failed to start the scan provider.',
                  'provider_start_failed'
                )
          );
        });
    });
  }
}
