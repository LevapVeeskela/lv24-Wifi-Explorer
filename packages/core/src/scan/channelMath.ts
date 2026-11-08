/**
 * Канал: полоса, primary-центр IEEE и occupying-центр (IE или стандартная раскладка).
 */

import type {
  BandGhz,
  ChannelCenterConfidence,
  ChannelView,
  ChannelWidthMhz,
  CoreWlanChannelBand,
  CoreWlanChannelWidth,
} from '../domain/channel';
import { WIDTH_HALF_MHZ } from '../domain/channel';
import type { ShallowIeView } from '../domain/ie';

const GHZ5_40_BLOCKS: readonly (readonly [number, number])[] = [
  [36, 40],
  [44, 48],
  [52, 56],
  [60, 64],
  [100, 104],
  [108, 112],
  [116, 120],
  [124, 128],
  [132, 136],
  [140, 144],
  [149, 153],
  [157, 161],
  [165, 169],
  [173, 177],
];

const GHZ5_80_BLOCKS: readonly (readonly [number, number])[] = [
  [36, 48],
  [52, 64],
  [100, 112],
  [116, 128],
  [132, 144],
  [149, 161],
  [165, 177],
];

const GHZ5_160_BLOCKS: readonly (readonly [number, number])[] = [
  [36, 64],
  [100, 128],
  [149, 177],
];

export function normalizeBand(band: CoreWlanChannelBand): BandGhz | 'unknown' {
  if (band === '2ghz') return 2.4;
  if (band === '5ghz') return 5;
  if (band === '6ghz') return 6;
  return 'unknown';
}

export function normalizeWidth(width: CoreWlanChannelWidth): ChannelWidthMhz | 'unknown' {
  if (width === '20mhz') return 20;
  if (width === '40mhz') return 40;
  if (width === '80mhz') return 80;
  if (width === '160mhz') return 160;
  return 'unknown';
}

/** IEEE primary 20 МГц. 4.9 ГГц public-safety не моделируем. */
export function primaryCenterMhz(band: BandGhz | 'unknown', channelNumber: number): number | null {
  if (!Number.isFinite(channelNumber) || channelNumber <= 0) return null;
  if (band === 2.4) {
    if (channelNumber === 14) return 2484;
    if (channelNumber >= 1 && channelNumber <= 13) return 2407 + 5 * channelNumber;
    return null;
  }
  if (band === 5) return 5000 + 5 * channelNumber;
  if (band === 6) return 5950 + 5 * channelNumber;
  return null;
}

function spanAround(center: number, width: ChannelWidthMhz): { from: number; to: number } {
  const half = WIDTH_HALF_MHZ[width];
  return { from: center - half, to: center + half };
}

function blockContains(ch: number, first: number, last: number): boolean {
  return ch >= first && ch <= last && (ch - first) % 4 === 0;
}

function ghz5BlockCenter(first: number, last: number): number {
  return (5000 + 5 * first + (5000 + 5 * last)) / 2;
}

function guess5GhzOccupying(ch: number, width: 40 | 80 | 160): number | null {
  const blocks = width === 40 ? GHZ5_40_BLOCKS : width === 80 ? GHZ5_80_BLOCKS : GHZ5_160_BLOCKS;
  for (const [first, last] of blocks) {
    if (blockContains(ch, first, last)) return ghz5BlockCenter(first, last);
  }
  return null;
}

/** 6 ГГц: каналы 1,5,9,…; блоки 40/80/160 не перекрываются. */
function guess6GhzOccupying(ch: number, width: 40 | 80 | 160): number | null {
  if (ch < 1 || ch > 233 || (ch - 1) % 4 !== 0) return null;
  const n20 = width / 20;
  const idx = (ch - 1) / 4;
  const block = Math.floor(idx / n20);
  const firstCh = 1 + block * n20 * 4;
  const lastCh = firstCh + (n20 - 1) * 4;
  if (lastCh > 233) return null;
  return (5950 + 5 * firstCh + (5950 + 5 * lastCh)) / 2;
}

/**
 * 2.4 / 40 МГц без IE: HT40+ для primary 1–7, HT40− для 8–13.
 * 80/160 на 2.4 не угадываем.
 */
function guess24GhzOccupying(ch: number, primaryMhz: number, width: 40 | 80 | 160): number | null {
  if (width !== 40) return null;
  if (ch < 1 || ch > 13) return null;
  return ch <= 7 ? primaryMhz + 10 : primaryMhz - 10;
}

export function standardLayoutOccupyingMhz(
  band: BandGhz | 'unknown',
  channelNumber: number,
  primaryMhz: number,
  width: 40 | 80 | 160
): number | null {
  if (band === 2.4) return guess24GhzOccupying(channelNumber, primaryMhz, width);
  if (band === 5) return guess5GhzOccupying(channelNumber, width);
  if (band === 6) return guess6GhzOccupying(channelNumber, width);
  return null;
}

function occupyingFromIe(
  band: BandGhz | 'unknown',
  width: ChannelWidthMhz,
  primaryMhz: number,
  ie: ShallowIeView
): number | null {
  if (width === 40 && (ie.htSecondaryOffset === 1 || ie.htSecondaryOffset === -1)) {
    return primaryMhz + 10 * ie.htSecondaryOffset;
  }
  if ((width === 40 || width === 80 || width === 160) && ie.ccfs0 != null && ie.ccfs0 > 0) {
    return primaryCenterMhz(band, ie.ccfs0);
  }
  return null;
}

export function computeChannelView(
  channelNumber: number | null,
  channelBand: CoreWlanChannelBand,
  channelWidth: CoreWlanChannelWidth,
  ie: ShallowIeView
): ChannelView {
  const number = channelNumber != null && Number.isFinite(channelNumber) ? channelNumber : 0;
  const band = normalizeBand(channelBand);
  const widthMhz = normalizeWidth(channelWidth);
  const primary = primaryCenterMhz(band, number);

  if (primary == null) {
    return {
      number,
      band,
      widthMhz,
      primaryCenterMhz: null,
      occupyingCenterMhz: null,
      occupyingSpanMhz: null,
      centerConfidence:
        widthMhz === 20 || widthMhz === 'unknown' ? 'ieee-primary-20' : 'standard-layout-guess',
    };
  }

  if (widthMhz === 20 || widthMhz === 'unknown') {
    const spanWidth: ChannelWidthMhz = 20;
    return {
      number,
      band,
      widthMhz,
      primaryCenterMhz: primary,
      occupyingCenterMhz: primary,
      occupyingSpanMhz: widthMhz === 20 ? spanAround(primary, spanWidth) : null,
      centerConfidence: 'ieee-primary-20',
    };
  }

  const fromIe = occupyingFromIe(band, widthMhz, primary, ie);
  if (fromIe != null) {
    return finishWide(number, band, widthMhz, primary, fromIe, 'ie-operation');
  }

  const guessed = standardLayoutOccupyingMhz(band, number, primary, widthMhz);
  return finishWide(number, band, widthMhz, primary, guessed, 'standard-layout-guess');
}

function finishWide(
  number: number,
  band: BandGhz | 'unknown',
  widthMhz: ChannelWidthMhz,
  primary: number,
  occupying: number | null,
  centerConfidence: ChannelCenterConfidence
): ChannelView {
  return {
    number,
    band,
    widthMhz,
    primaryCenterMhz: primary,
    occupyingCenterMhz: occupying,
    occupyingSpanMhz: occupying != null ? spanAround(occupying, widthMhz) : null,
    centerConfidence,
  };
}
