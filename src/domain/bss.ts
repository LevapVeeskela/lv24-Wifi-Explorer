/**
 * Observed BSS — атомарная строка скана (одна BSSID на одном primary channel).
 *
 * CoreWLAN называет объект `CWNetwork`, но это именно BSS/AP radio,
 * не ESS. Несколько CWNetwork с одним SSID — разные BSSID.
 */

import type { ChannelView, CoreWlanChannelBand, CoreWlanChannelWidth } from './channel';
import type { ShallowIeView } from './ie';
import type { BssIdentity, IsoTime, LocationGated } from './identity';
import type { MaxRateEstimate, PhyLetter, PhyView } from './phy';
import type { SecurityKind, SecurityView } from './security';
import type { SignalView } from './signal';
import type { PresenceView, RssiHistoryPoint } from './timeseries';
import type { VendorView } from './vendor';

/**
 * 1:1 снимок полей `CWNetwork` + результаты `supportsSecurity` / `supportsPHYMode`.
 * Без derived. Location-gated поля уже могут быть null.
 */
export interface CoreWlanNetworkRecord {
  ssid: string | null;
  ssidData: readonly number[] | null;
  bssid: string | null;
  rssiDbm: number;
  noiseDbm: number;
  channelNumber: number | null;
  channelBand: CoreWlanChannelBand;
  channelWidth: CoreWlanChannelWidth;
  countryCode: string | null;
  beaconIntervalMs: number;
  ibss: boolean;
  informationElementData: readonly number[] | null;
  supportedSecurity: readonly SecurityKind[];
  supportedPhyModes: readonly PhyLetter[];
}

export interface ObservedBss {
  identity: BssIdentity;
  /** `CWNetwork.ibss` — ad-hoc, не инфраструктурный AP. */
  ibss: boolean;
  countryCode: LocationGated<string | null>;
  beaconIntervalMs: number;
  signal: SignalView;
  channel: ChannelView;
  security: SecurityView;
  phy: PhyView;
  maxRate: MaxRateEstimate | null;
  vendor: VendorView;
  ie: ShallowIeView;
  presence: PresenceView;
  rssiHistory: readonly RssiHistoryPoint[];
  /** Сырой снимок последнего скана — для отладки/экспорта. */
  lastRaw: CoreWlanNetworkRecord;
}

/** Локальный интерфейс, к которому мы сейчас присоединены — не строка скана. */
export interface AssociatedLink {
  interfaceName: string;
  capturedAt: IsoTime;
  ssid: LocationGated<string | null>;
  bssid: LocationGated<string | null>;
  rssiDbm: number;
  noiseDbm: number;
  /** `CWInterface.transmitRate` — фактическая скорость линка, Mbps. */
  transmitRateMbps: number;
  /** `CWInterface.activePHYMode`. */
  activePhy: PhyLetter | null;
  security: SecurityKind;
  transmitPowerMw: number;
  hardwareAddress: string | null;
  countryCode: LocationGated<string | null>;
}
