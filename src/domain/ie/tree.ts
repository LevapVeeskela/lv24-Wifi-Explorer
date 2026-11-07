/**
 * Дерево полей для Advanced IE pane — из {@link DecodedIe}, без сторонних IE dumps.
 */

import { ieTreeTitle } from './names';
import type { AkmSuite, CipherSuite, DecodedIe, IeDecodeResult } from './types';

export interface IeTreeNode {
  /** Уникальный path внутри дерева BSS. */
  key: string;
  label: string;
  value: string | null;
  children: readonly IeTreeNode[];
}

function leaf(key: string, label: string, value: string | null): IeTreeNode {
  return { key, label, value, children: [] };
}

function branch(
  key: string,
  label: string,
  value: string | null,
  children: readonly IeTreeNode[],
): IeTreeNode {
  return { key, label, value, children };
}

function fmtBool(v: boolean | null): string {
  if (v == null) return '—';
  return v ? 'yes' : 'no';
}

function fmtCipher(s: CipherSuite | null): string {
  if (s == null) return '—';
  return `${s.name} (${s.oui}:${s.type})`;
}

function cipherList(label: string, key: string, suites: readonly CipherSuite[]): IeTreeNode[] {
  if (suites.length === 0) return [];
  return suites.map((s, i) => leaf(`${key}.${i}`, `${label} ${i + 1}`, fmtCipher(s)));
}

function akmList(key: string, suites: readonly AkmSuite[]): IeTreeNode[] {
  if (suites.length === 0) return [];
  return suites.map((s, i) => leaf(`${key}.${i}`, `AKM ${i + 1}`, `${s.name} (${s.oui}:${s.type})`));
}

function ratesMbpsList(rates: readonly number[]): string {
  if (rates.length === 0) return '—';
  return rates.map((r) => `${r} Mbps`).join(', ');
}

function treeForElement(index: number, el: DecodedIe): IeTreeNode {
  const rootKey = `ie.${index}`;
  const title = ieTreeTitle(el.id, el.extId);
  const rawChild = leaf(`${rootKey}.raw`, 'Raw hex', el.rawHex);

  switch (el.kind) {
    case 'ssid':
      return branch(rootKey, title, null, [
        leaf(`${rootKey}.ssid`, 'SSID', el.hidden ? '(hidden)' : el.ssid || '—'),
        leaf(`${rootKey}.hidden`, 'Hidden', fmtBool(el.hidden)),
        rawChild,
      ]);
    case 'rates':
      return branch(rootKey, title, null, [
        leaf(`${rootKey}.rates`, 'Rates', ratesMbpsList(el.ratesMbps)),
        leaf(`${rootKey}.basic`, 'Basic rates', ratesMbpsList(el.basicRatesMbps)),
        rawChild,
      ]);
    case 'ds':
      return branch(rootKey, title, null, [
        leaf(`${rootKey}.channel`, 'Channel', String(el.channel)),
        rawChild,
      ]);
    case 'country':
      return branch(rootKey, title, null, [
        leaf(`${rootKey}.code`, 'Country code', el.countryCode ?? '—'),
        leaf(`${rootKey}.env`, 'Environment', el.environment == null ? '—' : String(el.environment)),
        ...el.triplets.map((t, i) =>
          leaf(
            `${rootKey}.triplet.${i}`,
            `Regulatory triplet ${i + 1}`,
            `ch ${t.firstChannel} × ${t.channelCount}, max ${t.maxTxPowerDbm} dBm`,
          ),
        ),
        rawChild,
      ]);
    case 'bss-load':
      return branch(rootKey, title, null, [
        leaf(`${rootKey}.stations`, 'Station count', el.stationCount == null ? '—' : String(el.stationCount)),
        leaf(
          `${rootKey}.util`,
          'Channel utilization',
          el.channelUtilPct == null ? '—' : `${el.channelUtilPct.toFixed(1)}%`,
        ),
        leaf(
          `${rootKey}.aac`,
          'Available admission capacity',
          el.availableAdmissionCapacity == null ? '—' : String(el.availableAdmissionCapacity),
        ),
        rawChild,
      ]);
    case 'tim':
      return branch(rootKey, title, null, [
        leaf(`${rootKey}.dtimCount`, 'DTIM count', el.dtimCount == null ? '—' : String(el.dtimCount)),
        leaf(`${rootKey}.dtimPeriod`, 'DTIM period', el.dtimPeriod == null ? '—' : String(el.dtimPeriod)),
        leaf(
          `${rootKey}.bitmapControl`,
          'Bitmap control',
          el.bitmapControl == null ? '—' : `0x${el.bitmapControl.toString(16).padStart(2, '0')}`,
        ),
        leaf(`${rootKey}.bitmapLen`, 'Partial bitmap length', String(el.partialBitmapLength)),
        rawChild,
      ]);
    case 'power-constraint':
      return branch(rootKey, title, null, [
        leaf(
          `${rootKey}.local`,
          'Local power constraint',
          el.localPowerConstraintDb == null ? '—' : `${el.localPowerConstraintDb} dB`,
        ),
        rawChild,
      ]);
    case 'ht-capabilities':
      return branch(rootKey, title, null, [
        leaf(`${rootKey}.nss`, 'Spatial streams', el.nss == null ? '—' : String(el.nss)),
        leaf(`${rootKey}.40mhz`, '40 MHz', fmtBool(el.fortyMhz)),
        leaf(`${rootKey}.sgi20`, 'Short GI 20 MHz', fmtBool(el.shortGi20)),
        leaf(`${rootKey}.sgi40`, 'Short GI 40 MHz', fmtBool(el.shortGi40)),
        rawChild,
      ]);
    case 'rsn':
      return branch(rootKey, title, null, [
        leaf(`${rootKey}.ver`, 'Version', el.version == null ? '—' : String(el.version)),
        leaf(`${rootKey}.group`, 'Group cipher', fmtCipher(el.groupCipher)),
        ...cipherList('Pairwise', `${rootKey}.pairwise`, el.pairwise),
        ...akmList(`${rootKey}.akm`, el.akm),
        leaf(`${rootKey}.mfpc`, 'MFPC (PMF capable)', fmtBool(el.mfpc)),
        leaf(`${rootKey}.mfpr`, 'MFPR (PMF required)', fmtBool(el.mfpr)),
        rawChild,
      ]);
    case 'ht-operation':
      return branch(rootKey, title, null, [
        leaf(`${rootKey}.primary`, 'Primary channel', el.primaryChannel == null ? '—' : String(el.primaryChannel)),
        leaf(
          `${rootKey}.secondary`,
          'Secondary offset',
          el.secondaryOffset == null ? '—' : String(el.secondaryOffset),
        ),
        leaf(`${rootKey}.any40`, 'STA channel width any 40', fmtBool(el.staChannelWidthAny)),
        rawChild,
      ]);
    case 'vht-capabilities':
      return branch(rootKey, title, null, [
        leaf(`${rootKey}.nss`, 'Spatial streams', el.nss == null ? '—' : String(el.nss)),
        leaf(`${rootKey}.maxMcs`, 'Max MCS', el.maxMcs == null ? '—' : String(el.maxMcs)),
        leaf(`${rootKey}.sgi80`, 'Short GI 80 MHz', fmtBool(el.shortGi80)),
        leaf(`${rootKey}.sgi160`, 'Short GI 160 MHz', fmtBool(el.shortGi160)),
        leaf(
          `${rootKey}.chWidthSet`,
          'Supported channel width set',
          el.channelWidthSet == null ? '—' : String(el.channelWidthSet),
        ),
        rawChild,
      ]);
    case 'vht-operation':
      return branch(rootKey, title, null, [
        leaf(`${rootKey}.widthCode`, 'Channel width code', el.widthCode == null ? '—' : String(el.widthCode)),
        leaf(
          `${rootKey}.widthMhz`,
          'Channel width',
          el.widthMhz == null ? '—' : `${el.widthMhz} MHz`,
        ),
        leaf(`${rootKey}.ccfs0`, 'Center freq segment 0', el.ccfs0 == null ? '—' : String(el.ccfs0)),
        leaf(`${rootKey}.ccfs1`, 'Center freq segment 1', el.ccfs1 == null ? '—' : String(el.ccfs1)),
        rawChild,
      ]);
    case 'extended-capabilities':
      return branch(rootKey, title, null, [
        leaf(`${rootKey}.octets`, 'Length', String(el.octetCount)),
        ...el.setFlags.map((f, i) => leaf(`${rootKey}.flag.${i}`, f.name, 'set')),
        rawChild,
      ]);
    case 'vendor-wpa':
      return branch(rootKey, title, 'WPA IE', [
        leaf(`${rootKey}.oui`, 'OUI', el.oui ?? '—'),
        leaf(`${rootKey}.ver`, 'Version', el.version == null ? '—' : String(el.version)),
        leaf(`${rootKey}.group`, 'Group cipher', fmtCipher(el.groupCipher)),
        ...cipherList('Pairwise', `${rootKey}.pairwise`, el.pairwise),
        ...akmList(`${rootKey}.akm`, el.akm),
        rawChild,
      ]);
    case 'vendor':
      return branch(rootKey, title, null, [
        leaf(`${rootKey}.oui`, 'OUI', el.oui ?? '—'),
        leaf(
          `${rootKey}.type`,
          'Vendor type',
          el.vendorType == null ? '—' : `0x${el.vendorType.toString(16).padStart(2, '0')}`,
        ),
        rawChild,
      ]);
    case 'rsnx':
      return branch(rootKey, title, null, [
        leaf(`${rootKey}.h2e`, 'SAE hash-to-element', fmtBool(el.saeHashToElement)),
        rawChild,
      ]);
    case 'he-capabilities':
      return branch(rootKey, title, null, [
        leaf(`${rootKey}.nss`, 'Spatial streams', el.nss == null ? '—' : String(el.nss)),
        leaf(`${rootKey}.maxMcs`, 'Max MCS (≤80 MHz)', el.maxMcs == null ? '—' : String(el.maxMcs)),
        rawChild,
      ]);
    case 'he-operation':
      return branch(rootKey, title, null, [
        leaf(`${rootKey}.color`, 'BSS color', el.bssColor == null ? '—' : String(el.bssColor)),
        leaf(`${rootKey}.colorOff`, 'BSS color disabled', fmtBool(el.bssColorDisabled)),
        leaf(
          `${rootKey}.6gPrimary`,
          '6 GHz primary channel',
          el.sixGhzPrimaryChannel == null ? '—' : String(el.sixGhzPrimaryChannel),
        ),
        leaf(`${rootKey}.ccfs0`, 'Center freq segment 0', el.ccfs0 == null ? '—' : String(el.ccfs0)),
        rawChild,
      ]);
    case 'eht-capabilities':
      return branch(rootKey, title, null, [
        leaf(`${rootKey}.nss`, 'Spatial streams', el.nss == null ? '—' : String(el.nss)),
        leaf(`${rootKey}.maxMcs`, 'Max MCS (≤80 MHz)', el.maxMcs == null ? '—' : String(el.maxMcs)),
        rawChild,
      ]);
    case 'unknown':
      return branch(rootKey, title, null, [rawChild]);
    default:
      return branch(rootKey, title, null, [rawChild]);
  }
}

export function buildIeTree(result: IeDecodeResult): readonly IeTreeNode[] {
  const meta: IeTreeNode[] = [
    leaf('meta.level', 'Parse level', result.level),
    leaf('meta.length', 'Byte length', String(result.byteLength)),
    leaf('meta.count', 'Element count', String(result.elements.length)),
  ];
  const elements = result.elements.map((el, index) => treeForElement(index, el));
  return [...meta, ...elements];
}
