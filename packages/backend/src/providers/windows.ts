import { execFile } from 'node:child_process';
import type { CoreWlanNetworkRecord, SecurityKind } from '@lv24/wifi-core';
import { BaseScanProvider } from '../base';
import {
  isoNow,
  rssiFromQualityPercent,
  type ScanProviderOptions,
  type ScanSnapshotPayload,
} from '../types';
import { securityFromLabel } from './linux';

type PendingBss = {
  bssid: string;
  signal: number | null;
  channel: number | null;
  radio: string;
  securityText: string;
};

const BSSID_RE = /bssid\s+\d+\s*:\s*([0-9a-f]{2}(?::[0-9a-f]{2}){5})/i;
// `netsh` labels are localized; values are not. Match by shape, not by label.
const SIGNAL_RE = /:\s*(\d{1,3})%\s*$/;
const CHANNEL_RE = /:\s*(\d{1,4})\s*$/;
const RADIO_RE = /802\.11([a-z]+)/i;

/**
 * Parse `netsh wlan show networks mode=bssid`.
 *
 * `SSID n:` and `BSSID n :` stay English on localized Windows, but the field
 * labels (`Signal`, `Channel`, `Authentication`, ...) do not. The parser therefore
 * reads values by shape (percentage, bare integer, 802.11 token) and builds the
 * security label from the whole SSID block, so Russian/Chinese output still
 * yields real signal, channel and security instead of defaults.
 *
 * A BSS entry without a parsable signal is dropped: `rssiDbm` has no "unknown"
 * representation in `CoreWlanNetworkRecord`, and emitting -100 dBm would be a
 * lie. If every entry is dropped, the provider reports an explicit error and the
 * desktop falls back to a clearly labelled demo snapshot.
 */
export function parseNetshNetworks(stdout: string): CoreWlanNetworkRecord[] {
  const records: CoreWlanNetworkRecord[] = [];
  let currentSsid: string | null = null;
  let pending: PendingBss | null = null;
  let ssidBlock: string[] = [];

  const flush = () => {
    if (!pending) return;
    if (pending.signal == null) {
      pending = null;
      return;
    }
    const security = pending.securityText.trim()
      ? securityFromLabel(pending.securityText)
      : (['unknown'] as CoreWlanNetworkRecord['supportedSecurity']);
    const channel = pending.channel;
    const band: CoreWlanNetworkRecord['channelBand'] =
      channel == null ? 'unknown' : channel <= 14 ? '2ghz' : channel >= 233 ? '6ghz' : '5ghz';
    records.push({
      ssid: currentSsid,
      ssidData: currentSsid ? [...Buffer.from(currentSsid, 'utf8')] : null,
      bssid: pending.bssid.toLowerCase(),
      rssiDbm: rssiFromQualityPercent(pending.signal),
      // netsh does not expose noise or beacon interval; use NaN so JSON/UI
      // serializes them as unknown instead of inventing 0 dBm / 100 ms.
      noiseDbm: Number.NaN,
      channelNumber: channel,
      channelBand: band,
      channelWidth: 'unknown',
      countryCode: null,
      beaconIntervalMs: Number.NaN,
      ibss: false,
      informationElementData: null,
      supportedSecurity: security,
      supportedPhyModes: radioToPhy(pending.radio),
    });
    pending = null;
  };

  for (const rawLine of stdout.split(/\r?\n/)) {
    const line = rawLine.trim();
    const ssidMatch = line.match(/^SSID\s+\d+\s*:\s*(.*)$/i);
    if (ssidMatch) {
      flush();
      currentSsid = ssidMatch[1]?.trim() || null;
      ssidBlock = [];
      continue;
    }
    const bssidMatch = line.match(BSSID_RE);
    if (bssidMatch) {
      flush();
      pending = {
        bssid: bssidMatch[1]!,
        signal: null,
        channel: null,
        radio: '',
        securityText: ssidBlock.join(' '),
      };
      continue;
    }
    if (pending) {
      const signal = line.match(SIGNAL_RE);
      if (signal) pending.signal = Number.parseInt(signal[1]!, 10);
      const radio = line.match(RADIO_RE);
      if (radio) pending.radio = `802.11${radio[1]!.toLowerCase()}`;
      const channel = line.match(CHANNEL_RE);
      if (channel) {
        const value = Number.parseInt(channel[1]!, 10);
        // QoS lines also end in a bare integer, but their value is 0.
        if (value > 0 && pending.channel == null) pending.channel = value;
      }
    } else if (line) {
      ssidBlock.push(line);
    }
  }
  flush();

  return records;
}

function radioToPhy(radio: string): CoreWlanNetworkRecord['supportedPhyModes'] {
  const value = radio.toLowerCase();
  if (value.includes('ax')) return ['ax'];
  if (value.includes('ac')) return ['ac'];
  if (value.includes('n')) return ['n'];
  if (value.includes('g')) return ['g'];
  if (value.includes('b')) return ['b'];
  if (value.includes('a')) return ['a'];
  return [];
}

/** Windows provider via `netsh wlan show networks mode=bssid`. */
export class WindowsNetshProvider extends BaseScanProvider {
  readonly id = 'windows-netsh' as const;
  private timer: ReturnType<typeof setInterval> | null = null;
  private inFlight = false;
  private stopping = false;

  async start(options: ScanProviderOptions): Promise<void> {
    this.stopping = false;
    if (options.directedSsid) {
      this.emitError({
        code: 'DIRECTED_SSID_UNSUPPORTED',
        message: 'Directed SSID scan is macOS-only; netsh performs a full scan of every SSID.',
        recoverable: true,
      });
    }
    this.emit({ type: 'permissions', location: 'granted', demo: false });
    this.emit({ type: 'status', running: true, scanning: true, helper: 'netsh' });
    const tick = () => this.poll(options);
    tick();
    this.timer = setInterval(tick, Math.max(3000, options.intervalMs));
    this.timer.unref?.();
  }

  private poll(options: ScanProviderOptions): void {
    if (this.inFlight || this.stopping) return;
    this.inFlight = true;
    execFile(
      'netsh',
      ['wlan', 'show', 'networks', 'mode=bssid'],
      { timeout: 20_000, maxBuffer: 8 * 1024 * 1024, windowsHide: true },
      (error, stdout, stderr) => {
        this.inFlight = false;
        if (this.stopping) return;
        if (error) {
          this.emitError({
            code: 'NETSH_FAILED',
            message: stderr.trim() || error.message,
            recoverable: true,
            demoFallback: true,
          });
          return;
        }
        const networks = parseNetshNetworks(stdout);
        if (networks.length === 0) {
          this.emitError({
            code: 'NETSH_PARSE_EMPTY',
            message:
              'netsh returned no BSS entries with a parsable signal. Localized output is parsed structurally; this variant may be unsupported.',
            recoverable: true,
            demoFallback: true,
          });
          return;
        }
        const payload: ScanSnapshotPayload = {
          capturedAt: isoNow(),
          interfaceName: null,
          location: 'granted',
          networks,
          associated: null,
          includeHiddenRequested: options.includeHidden,
          source: 'netsh',
          demo: false,
        };
        this.emitSnapshot(payload);
      }
    );
  }

  setIntervalMs(intervalMs: number): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    const ms = Math.max(3000, Math.floor(intervalMs));
    this.timer = setInterval(() => this.poll({ intervalMs: ms, includeHidden: true }), ms);
    this.timer.unref?.();
  }

  async stop(): Promise<void> {
    this.stopping = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.emit({ type: 'status', running: false, scanning: false });
  }
}

export type { CoreWlanNetworkRecord, SecurityKind };
