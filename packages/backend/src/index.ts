import { DemoScanProvider } from './providers/demo';
import { LinuxNmcliProvider } from './providers/linux';
import { MacScanCoreProvider } from './providers/macos';
import { WindowsNetshProvider } from './providers/windows';
import type { ScanProvider, ScanProviderId } from './types';

export type CreateScanProviderOptions = {
  /** `auto` picks the native provider for the current platform, else demo. */
  provider?: ScanProviderId;
  /** macOS helper path override. */
  binaryPath?: string;
};

export function platformProviderId(platform: NodeJS.Platform = process.platform): ScanProviderId {
  if (platform === 'darwin') return 'macos-scancore';
  if (platform === 'linux') return 'linux-nmcli';
  if (platform === 'win32') return 'windows-netsh';
  return 'demo';
}

export function createScanProvider(options: CreateScanProviderOptions = {}): ScanProvider {
  const requested = options.provider ?? 'auto';
  const id = requested === 'auto' ? platformProviderId() : requested;
  switch (id) {
    case 'macos-scancore':
      return new MacScanCoreProvider();
    case 'linux-nmcli':
      return new LinuxNmcliProvider();
    case 'windows-netsh':
      return new WindowsNetshProvider();
    case 'demo':
      return new DemoScanProvider();
    default:
      return new DemoScanProvider();
  }
}

export { DemoScanProvider, LinuxNmcliProvider, MacScanCoreProvider, WindowsNetshProvider };
export { normalizeScanCoreSnapshot } from './normalize';
export { parseNmcliWifiList, securityFromLabel } from './providers/linux';
export { parseNetshNetworks } from './providers/windows';
export {
  demoAdapterCapabilities,
  parseIwCapabilities,
  parseNetshCapabilities,
  parseSystemProfilerCapabilities,
  readAdapterCapabilities,
  type AdapterCapabilitiesResult,
} from './adapterCapabilities';
export {
  listSavedWifiProfiles,
  parseNetshKey,
  parseNetshProfiles,
  parseNmcliWifiConnections,
  readSavedWifiPassword,
  type SavedWifiProfilesResult,
  type WifiPasswordCode,
  type WifiPasswordResult,
} from './wifiPassword';
export * from './types';
