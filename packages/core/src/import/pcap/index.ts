/**
 * Offline capture import: classic pcap + pcapng → CoreWlanNetworkRecord[].
 *
 * Offline captures are the only place this project can honestly show fields
 * CoreWLAN hides (full IEs, HT/VHT/HE operation, per-frame RSSI). Everything
 * the bytes do not prove stays null / 'unknown' / 0, and the caller gets
 * warnings instead of invented values.
 */

import type { CoreWlanNetworkRecord } from '../../domain/bss';
import { PHY_DISPLAY_ORDER } from '../../domain/phy';
import type { PhyLetter } from '../../domain/phy';
import { SECURITY_PRIMARY_RANK } from '../../domain/security';
import type { SecurityKind } from '../../domain/security';
import {
  bandFromChannelNumber,
  bandFromFrequency,
  channelFromFrequency,
  countryFromIes,
  dsChannel,
  inferPhyModes,
  inferSecurity,
  inferWidth,
  parseBeaconLikeFrame,
} from './dot11';
import { isClassicPcapMagic, parseClassicPcap } from './pcap';
import { isPcapngMagic, parsePcapng } from './pcapng';
import { parseRadiotap } from './radiotap';
import { PCAP_IMPORT_DEFAULTS, Warnings } from './types';
import type { PcapImportOptions, PcapImportResult } from './types';

export type { PcapImportOptions, PcapImportResult } from './types';
export { PCAP_IMPORT_DEFAULTS } from './types';

const LINKTYPE_RADIOTAP = 127;
const LINKTYPE_80211 = 105;

function resolveLimit(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
}

function isStronger(candidate: number, current: number): boolean {
  if (candidate === 0) return false;
  if (current === 0) return true;
  return candidate > current;
}

function pickLonger(
  a: readonly number[] | null,
  b: readonly number[] | null
): readonly number[] | null {
  if (a === null) return b;
  if (b === null) return a;
  return b.length > a.length ? b : a;
}

function unionSecurity(a: readonly SecurityKind[], b: readonly SecurityKind[]): SecurityKind[] {
  const union = new Set<SecurityKind>([...a, ...b]);
  if (union.size > 1) union.delete('unknown');
  const rank = (kind: SecurityKind): number => {
    const index = SECURITY_PRIMARY_RANK.indexOf(kind);
    return index === -1 ? SECURITY_PRIMARY_RANK.length : index;
  };
  return Array.from(union).sort((x, y) => rank(x) - rank(y));
}

function unionPhy(a: readonly PhyLetter[], b: readonly PhyLetter[]): PhyLetter[] {
  const union = new Set<PhyLetter>([...a, ...b]);
  return PHY_DISPLAY_ORDER.filter((letter) => union.has(letter));
}

function mergeRecords(
  current: CoreWlanNetworkRecord,
  incoming: CoreWlanNetworkRecord
): CoreWlanNetworkRecord {
  const stronger = isStronger(incoming.rssiDbm, current.rssiDbm) ? incoming : current;
  const weaker = stronger === current ? incoming : current;
  return {
    ssid: stronger.ssid ?? weaker.ssid,
    ssidData: stronger.ssidData ?? weaker.ssidData,
    bssid: stronger.bssid ?? weaker.bssid,
    rssiDbm: stronger.rssiDbm,
    noiseDbm: 0,
    channelNumber: stronger.channelNumber ?? weaker.channelNumber,
    channelBand: stronger.channelBand !== 'unknown' ? stronger.channelBand : weaker.channelBand,
    channelWidth: stronger.channelWidth !== 'unknown' ? stronger.channelWidth : weaker.channelWidth,
    countryCode: stronger.countryCode ?? weaker.countryCode,
    beaconIntervalMs: stronger.beaconIntervalMs || weaker.beaconIntervalMs,
    ibss: stronger.ibss || weaker.ibss,
    informationElementData: pickLonger(
      stronger.informationElementData,
      weaker.informationElementData
    ),
    supportedSecurity: unionSecurity(stronger.supportedSecurity, weaker.supportedSecurity),
    supportedPhyModes: unionPhy(stronger.supportedPhyModes, weaker.supportedPhyModes),
  };
}

interface ImportState {
  records: Map<string, CoreWlanNetworkRecord>;
  warnings: Warnings;
  framesWithoutSignal: number;
}

function handleFrame(linktype: number, frame: Uint8Array, state: ImportState): void {
  if (linktype !== LINKTYPE_RADIOTAP && linktype !== LINKTYPE_80211) {
    state.warnings.add(`linktype: unsupported ${linktype} (expected 127 radiotap or 105 802.11)`);
    return;
  }

  let offset = 0;
  let signalDbm: number | null = null;
  let frequencyMhz: number | null = null;
  let hasFcs = false;

  if (linktype === LINKTYPE_RADIOTAP) {
    const radiotap = parseRadiotap(frame);
    if (!radiotap.ok) {
      state.warnings.add(radiotap.reason);
      return;
    }
    offset = radiotap.header.length;
    signalDbm = radiotap.header.signalDbm;
    frequencyMhz = radiotap.header.frequencyMhz;
    hasFcs = radiotap.header.hasFcs;
    if (radiotap.header.firstUnknownPresentBit !== null) {
      state.warnings.add(
        `radiotap: unknown present field bit ${radiotap.header.firstUnknownPresentBit}; trailing fields not parsed`
      );
    }
    if (hasFcs && frame.length < offset + 4) {
      state.warnings.add('frame: FCS flagged by radiotap but frame is too short');
      return;
    }
  } else {
    state.warnings.add('linktype 105: 802.11 frames assumed to carry no FCS');
  }

  if (frame.length <= offset) {
    state.warnings.add('frame: no 802.11 payload after link-layer header');
    return;
  }

  const parsed = parseBeaconLikeFrame(frame.subarray(offset), hasFcs);
  if (!parsed.ok) {
    state.warnings.add(parsed.reason);
    return;
  }
  const beacon = parsed.frame;
  if (beacon.truncatedIe) {
    state.warnings.add('ie: truncated information element at end of frame');
  }
  if (signalDbm === null) state.framesWithoutSignal += 1;

  const ds = dsChannel(beacon.ies);
  const frequencyChannel = frequencyMhz === null ? null : channelFromFrequency(frequencyMhz);
  if (ds !== null && frequencyChannel !== null && ds !== frequencyChannel) {
    state.warnings.add(
      `channel: DS IE channel ${ds} disagrees with radiotap frequency channel ${frequencyChannel}`
    );
  }
  const channelNumber = ds ?? frequencyChannel;
  if (frequencyMhz === null && channelNumber !== null) {
    state.warnings.add('channel: no radiotap frequency; band inferred from channel number');
  }
  const channelBand =
    frequencyMhz !== null
      ? bandFromFrequency(frequencyMhz)
      : channelNumber !== null
        ? bandFromChannelNumber(channelNumber)
        : 'unknown';

  const security = inferSecurity(beacon.ies, beacon.capability);

  const record: CoreWlanNetworkRecord = {
    ssid: beacon.ssid,
    ssidData: beacon.ssidBytes,
    bssid: beacon.bssid,
    rssiDbm: signalDbm ?? 0,
    noiseDbm: 0,
    channelNumber,
    channelBand,
    channelWidth: inferWidth(beacon.ies, beacon.truncatedIe),
    countryCode: countryFromIes(beacon.ies),
    beaconIntervalMs: beacon.beaconIntervalMs,
    ibss: beacon.ibss,
    informationElementData: beacon.ieBytes,
    supportedSecurity: security.kinds,
    supportedPhyModes: inferPhyModes(beacon.ies),
  };

  const key = `${beacon.bssid}|${channelNumber ?? '?'}`;
  const existing = state.records.get(key);
  state.records.set(key, existing === undefined ? record : mergeRecords(existing, record));
}

/** True when the buffer starts with a pcap or pcapng magic. */
export function isCaptureFile(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  const magic =
    (bytes[0] as number) |
    ((bytes[1] as number) << 8) |
    ((bytes[2] as number) << 16) |
    ((bytes[3] as number) << 24);
  return isClassicPcapMagic(magic >>> 0) || isPcapngMagic(magic >>> 0);
}

/**
 * Parse a pcap / pcapng capture.
 *
 * Throws nothing on malformed input: problems land in `warnings`, and the
 * result may be empty. Oversized input is refused before any parsing.
 */
export function importCapture(
  input: Uint8Array | ArrayBuffer,
  options: PcapImportOptions = {}
): PcapImportResult {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const maxFrames = resolveLimit(options.maxFrames, PCAP_IMPORT_DEFAULTS.maxFrames);
  const maxBytes = resolveLimit(options.maxBytes, PCAP_IMPORT_DEFAULTS.maxBytes);
  const maxWarnings = resolveLimit(options.maxWarnings, PCAP_IMPORT_DEFAULTS.maxWarnings);
  const warnings = new Warnings(maxWarnings);

  if (bytes.length === 0) {
    warnings.add('input: empty capture');
    return { records: [], warnings: warnings.list, frames: 0 };
  }
  if (bytes.length > maxBytes) {
    warnings.add(
      `input: too large (${bytes.length} bytes > max ${maxBytes} bytes); nothing parsed`
    );
    return { records: [], warnings: warnings.list, frames: 0 };
  }
  if (bytes.length < 4) {
    warnings.add('input: shorter than 4 bytes; no capture magic');
    return { records: [], warnings: warnings.list, frames: 0 };
  }

  const state: ImportState = {
    records: new Map(),
    warnings,
    framesWithoutSignal: 0,
  };
  const onFrame = (linktype: number, frame: Uint8Array): void => {
    handleFrame(linktype, frame, state);
  };

  const magic =
    ((bytes[0] as number) |
      ((bytes[1] as number) << 8) |
      ((bytes[2] as number) << 16) |
      ((bytes[3] as number) << 24)) >>>
    0;

  let frames = 0;
  if (isPcapngMagic(magic)) {
    frames = parsePcapng(bytes, maxFrames, onFrame, warnings);
  } else if (isClassicPcapMagic(magic)) {
    frames = parseClassicPcap(bytes, maxFrames, onFrame, warnings).frames;
  } else {
    warnings.add(`capture: unrecognized format (magic 0x${magic.toString(16).padStart(8, '0')})`);
  }

  const records = Array.from(state.records.values());
  if (frames === 0) {
    warnings.add('capture: no packet records found');
  } else if (records.length === 0) {
    warnings.add('capture: no beacon or probe response frames found');
  }
  if (state.framesWithoutSignal > 0) {
    warnings.add(
      `${state.framesWithoutSignal} frame(s) had no radiotap antenna signal; rssiDbm left 0`
    );
  }

  return { records, warnings: warnings.list, frames };
}
