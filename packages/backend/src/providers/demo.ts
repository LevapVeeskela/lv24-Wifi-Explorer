import type { CoreWlanNetworkRecord } from '@lv24/wifi-core';
import { BaseScanProvider } from '../base';
import { isoNow, type ScanProviderOptions, type ScanSnapshotPayload } from '../types';

const DEMO_NETWORKS: readonly CoreWlanNetworkRecord[] = [
  {
    ssid: 'LV24-Demo-5G',
    ssidData: [...Buffer.from('LV24-Demo-5G')],
    bssid: '02:11:22:33:44:55',
    rssiDbm: -48,
    noiseDbm: -92,
    channelNumber: 36,
    channelBand: '5ghz',
    channelWidth: '80mhz',
    countryCode: 'RU',
    beaconIntervalMs: 100,
    ibss: false,
    informationElementData: null,
    supportedSecurity: ['wpa3-personal'],
    supportedPhyModes: ['n', 'ac', 'ax'],
  },
  {
    ssid: 'LV24-Demo-2G',
    ssidData: [...Buffer.from('LV24-Demo-2G')],
    bssid: '02:11:22:33:44:66',
    rssiDbm: -67,
    noiseDbm: -90,
    channelNumber: 6,
    channelBand: '2ghz',
    channelWidth: '20mhz',
    countryCode: 'RU',
    beaconIntervalMs: 102,
    ibss: false,
    informationElementData: null,
    supportedSecurity: ['wpa2-personal'],
    supportedPhyModes: ['b', 'g', 'n'],
  },
  {
    ssid: null,
    ssidData: [],
    bssid: '02:11:22:33:44:77',
    rssiDbm: -78,
    noiseDbm: -90,
    channelNumber: 149,
    channelBand: '5ghz',
    channelWidth: '40mhz',
    countryCode: 'RU',
    beaconIntervalMs: 100,
    ibss: false,
    informationElementData: null,
    supportedSecurity: ['open'],
    supportedPhyModes: ['a', 'n', 'ac'],
  },
];

/** Deterministic provider for CI, open-source demos, and unsupported platforms. */
export class DemoScanProvider extends BaseScanProvider {
  readonly id = 'demo' as const;
  private timer: ReturnType<typeof setInterval> | null = null;

  async start(options: ScanProviderOptions): Promise<void> {
    this.stopTimer();
    if (options.directedSsid) {
      this.emitError({
        code: 'DIRECTED_SSID_UNSUPPORTED',
        message: 'Demo fixtures ignore directedSsid; full fixture set is emitted.',
        recoverable: true,
      });
    }
    const emit = () => {
      const payload: ScanSnapshotPayload = {
        capturedAt: isoNow(),
        interfaceName: 'demo0',
        location: 'granted',
        networks: [...(options.fixtureNetworks ?? DEMO_NETWORKS)],
        associated: null,
        includeHiddenRequested: options.includeHidden,
        source: 'fixtures',
        demo: true,
      };
      this.emitSnapshot(payload);
      this.emit({ type: 'permissions', location: 'granted', demo: true });
    };
    emit();
    this.timer = setInterval(emit, Math.max(3000, options.intervalMs));
    this.timer.unref?.();
  }

  async stop(): Promise<void> {
    this.stopTimer();
  }

  private stopTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
