import { execFile } from 'node:child_process';
import { BaseScanProvider } from '../base';
import {
  bandForChannel,
  isoNow,
  rssiFromQualityPercent,
  type ScanProviderOptions,
  type ScanSnapshotPayload,
} from '../types';
import type { CoreWlanNetworkRecord, SecurityKind } from '@lv24/wifi-core';

/** Split nmcli `-t` output on unescaped colons (`\:` inside values). */
function splitNmcli(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let escaped = false;
  for (const char of line) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === ':') {
      out.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  out.push(current);
  return out;
}

const SECURITY_PATTERNS: ReadonlyArray<[RegExp, SecurityKind]> = [
  [/wpa3.*enterprise|enterprise.*wpa3/i, 'wpa3-enterprise'],
  [/wpa3.*(personal|sae)|sae/i, 'wpa3-personal'],
  [/owe/i, 'owe'],
  [/wpa2.*enterprise|enterprise.*wpa2/i, 'wpa2-enterprise'],
  [/wpa3/i, 'wpa3-personal'],
  [/wpa2/i, 'wpa2-personal'],
  [/wpa.*enterprise/i, 'wpa-enterprise'],
  [/wpa/i, 'wpa-personal'],
  [/wep/i, 'wep'],
];

export function securityFromLabel(label: string): SecurityKind[] {
  const value = label.trim();
  if (!value || value === '--') return ['open'];
  // Open/none is localized by netsh: English `Open`, Russian `Открыть`,
  // Chinese `打开`/`无`. Only treat it as open when no stronger marker exists.
  if (!/(wpa|wep|owe|sae)/i.test(value) && /(open|none|--|открыт|打开|无|нет)/i.test(value)) {
    return ['open'];
  }
  for (const [pattern, kind] of SECURITY_PATTERNS) {
    if (pattern.test(value)) return [kind];
  }
  return ['unknown'];
}

/** Parse `nmcli -t -f BSSID,SSID,CHAN,FREQ,SIGNAL,SECURITY dev wifi list`. */
export function parseNmcliWifiList(stdout: string): CoreWlanNetworkRecord[] {
  const records: CoreWlanNetworkRecord[] = [];
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let fields = splitNmcli(line);
    // nmcli may or may not escape BSSID colons depending on version/field.
    let bssid = fields[0] ?? '';
    if (/^[0-9a-f]{2}$/i.test(bssid) && fields.length >= 11) {
      bssid = fields.slice(0, 6).join(':');
      fields = fields.slice(6);
    } else {
      fields = fields.slice(1);
    }
    if (fields.length < 5) continue;
    const [ssid, chanRaw, freqRaw, signalRaw, security] = fields;
    if (!/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(bssid)) continue;
    const channel = Number.parseInt(chanRaw, 10);
    if (!Number.isFinite(channel)) continue;
    const band = bandForChannel(channel);
    const signal = Number.parseInt(signalRaw, 10);
    records.push({
      ssid: ssid.length > 0 ? ssid : null,
      ssidData: ssid.length > 0 ? [...Buffer.from(ssid, 'utf8')] : null,
      bssid: bssid.toLowerCase(),
      rssiDbm: rssiFromQualityPercent(Number.isFinite(signal) ? signal : 0),
      noiseDbm: Number.NaN,
      channelNumber: channel,
      channelBand: band === '2.4' ? '2ghz' : band === '6' ? '6ghz' : '5ghz',
      channelWidth: 'unknown',
      countryCode: null,
      beaconIntervalMs: Number.NaN,
      ibss: false,
      informationElementData: null,
      supportedSecurity: securityFromLabel(security),
      supportedPhyModes: [],
    });
    // freqRaw is retained by nmcli for diagnostics; rssi/band above are derived.
    void freqRaw;
  }
  return records;
}

const NMCLI_FIELDS = 'BSSID,SSID,CHAN,FREQ,SIGNAL,SECURITY';

/** Linux provider via NetworkManager `nmcli` (no monitor mode, no IEs). */
export class LinuxNmcliProvider extends BaseScanProvider {
  readonly id = 'linux-nmcli' as const;
  private timer: ReturnType<typeof setInterval> | null = null;
  private inFlight = false;
  private stopping = false;
  private location = 'granted' as const;

  async start(options: ScanProviderOptions): Promise<void> {
    this.stopping = false;
    if (options.directedSsid) {
      this.emitError({
        code: 'DIRECTED_SSID_UNSUPPORTED',
        message: 'Directed SSID scan is macOS-only; nmcli performs a full scan of every SSID.',
        recoverable: true,
      });
    }
    this.emit({ type: 'permissions', location: this.location, demo: false });
    this.emit({
      type: 'status',
      running: true,
      scanning: true,
      helper: options.binaryPath ?? 'nmcli',
    });
    const tick = () => this.poll(options);
    tick();
    this.timer = setInterval(tick, Math.max(3000, options.intervalMs));
    this.timer.unref?.();
  }

  private poll(options: ScanProviderOptions): void {
    if (this.inFlight || this.stopping) return;
    this.inFlight = true;
    const command = options.binaryPath ?? 'nmcli';
    execFile(
      command,
      ['-t', '-f', NMCLI_FIELDS, 'dev', 'wifi', 'list', '--rescan', 'yes'],
      { timeout: 15_000, maxBuffer: 8 * 1024 * 1024 },
      (error, stdout, stderr) => {
        this.inFlight = false;
        if (this.stopping) return;
        if (error) {
          this.emitError({
            code: 'NMCLI_FAILED',
            message: stderr.trim() || error.message,
            recoverable: true,
            demoFallback: true,
          });
          return;
        }
        const networks = parseNmcliWifiList(stdout);
        const payload: ScanSnapshotPayload = {
          capturedAt: isoNow(),
          interfaceName: null,
          location: this.location,
          networks,
          associated: null,
          includeHiddenRequested: options.includeHidden,
          source: 'nmcli',
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
