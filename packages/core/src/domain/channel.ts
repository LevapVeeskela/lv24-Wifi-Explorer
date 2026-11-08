/**
 * Канал: сырые поля CoreWLAN + вывод частоты.
 *
 * `CWChannel.channelNumber` — primary channel, не обязательно центр 80/160 МГц.
 * Центр занимаемой полосы шире 20 МГц без HT/VHT/HE Operation IE —
 * только стандартная раскладка IEEE, то есть computed-approximation.
 */

import type { ShallowIeView } from './ie';

/** Соответствует `CWChannelBand`. */
export type CoreWlanChannelBand = 'unknown' | '2ghz' | '5ghz' | '6ghz';

/**
 * Соответствует `CWChannelWidth`.
 * 80+80 и 320 МГц (EHT) в CoreWLAN нет → unsupported.
 */
export type CoreWlanChannelWidth = 'unknown' | '20mhz' | '40mhz' | '80mhz' | '160mhz';

export type BandGhz = 2.4 | 5 | 6;

export type ChannelWidthMhz = 20 | 40 | 80 | 160;

export interface FrequencySpanMhz {
  from: number;
  to: number;
}

export type ChannelCenterConfidence =
  /** Центр 20 МГц primary по таблицам IEEE — достаточно точно. */
  | 'ieee-primary-20'
  /** Primary + secondary/CCFS из HT/VHT/HE Operation в IE. */
  | 'ie-operation'
  /** Типовые неперекрывающиеся блоки 40/80/160 без IE. */
  | 'standard-layout-guess';

export interface ChannelView {
  /** `CWChannel.channelNumber`. */
  number: number;
  /** Нормализация `CWChannel.channelBand` → 2.4 / 5 / 6. */
  band: BandGhz | 'unknown';
  widthMhz: ChannelWidthMhz | 'unknown';

  /**
   * Центр 20 МГц primary, МГц.
   * 2.4: 2407+5·n (ch14 = 2484); 5: 5000+5·n; 6: 5950+5·n.
   */
  primaryCenterMhz: number | null;

  /**
   * Центр занимаемой полосы. При width=20 совпадает с primary.
   * При 40/80/160 без IE — standard-layout-guess.
   */
  occupyingCenterMhz: number | null;
  occupyingSpanMhz: FrequencySpanMhz | null;
  centerConfidence: ChannelCenterConfidence;
}

/**
 * Формулы primary-центра (derived, не approximation — для 20 МГц).
 * 4.9 ГГц public-safety (Япония) не моделируем в v1.
 */
export const PRIMARY_CENTER_MHZ = {
  band24: {
    ch1to13: '2407 + 5 * channelNumber',
    ch14: 2484,
  },
  band5: '5000 + 5 * channelNumber',
  band6: '5950 + 5 * channelNumber',
} as const;

/** Половина ширины для span: [center - half, center + half]. */
export const WIDTH_HALF_MHZ: Record<ChannelWidthMhz, number> = {
  20: 10,
  40: 20,
  80: 40,
  160: 80,
};

/**
 * Поддиапазон UNII по первичным таблицам FCC (не UI стороннего приложения).
 * 2.4 ГГц ISM → `none`.
 */
export type UniiSubband =
  | 'none'
  | 'unii-1'
  | 'unii-2a'
  | 'unii-2c'
  | 'unii-3'
  | 'unii-4'
  | 'unii-5'
  | 'unii-6'
  | 'unii-7'
  | 'unii-8';

/** Строка таблицы UNII: полуинтервал [fromMhz, toMhz), кроме последнего. */
export interface UniiSubbandRange {
  id: Exclude<UniiSubband, 'none'>;
  band: 5 | 6;
  fromMhz: number;
  toMhz: number;
  dfs: boolean;
}

/**
 * Публичные границы FCC UNII.
 * UNII-2B (5350–5470) в WLAN не используем.
 */
export const UNII_SUBBAND_TABLE: readonly UniiSubbandRange[] = [
  { id: 'unii-1', band: 5, fromMhz: 5150, toMhz: 5250, dfs: false },
  { id: 'unii-2a', band: 5, fromMhz: 5250, toMhz: 5350, dfs: true },
  { id: 'unii-2c', band: 5, fromMhz: 5470, toMhz: 5725, dfs: true },
  { id: 'unii-3', band: 5, fromMhz: 5725, toMhz: 5850, dfs: false },
  { id: 'unii-4', band: 5, fromMhz: 5850, toMhz: 5925, dfs: false },
  { id: 'unii-5', band: 6, fromMhz: 5925, toMhz: 6425, dfs: false },
  { id: 'unii-6', band: 6, fromMhz: 6425, toMhz: 6525, dfs: false },
  { id: 'unii-7', band: 6, fromMhz: 6525, toMhz: 6875, dfs: false },
  { id: 'unii-8', band: 6, fromMhz: 6875, toMhz: 7125, dfs: false },
];

/** Primary 20 МГц каналы 2.4 ГГц (1–14). */
export const BAND_24_CHANNELS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

/** Primary 20 МГц каналы 5 ГГц по UNII-1…4. */
export const BAND_5_CHANNELS: readonly number[] = [
  36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144, 149,
  153, 157, 161, 165, 169, 173, 177,
];

/** Primary 20 МГц каналы 6 ГГц: 1, 5, …, 233. */
export const BAND_6_CHANNELS: readonly number[] = Array.from({ length: 59 }, (_, i) => 1 + i * 4);

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

const ABSENT_IE: ShallowIeView = {
  level: 'absent',
  byteLength: 0,
  presentIds: [],
  wpaVendorIe: null,
  rsnIe: null,
  htCapabilities: null,
  vhtCapabilities: null,
  heCapabilities: null,
  ehtCapabilities: null,
  countryFromIe: null,
  nssHint: null,
  htPrimaryChannel: null,
  htSecondaryOffset: null,
  ccfs0: null,
};

/** Нормализация `CWChannelBand` → 2.4 / 5 / 6. */
export function normalizeBand(band: CoreWlanChannelBand): BandGhz | 'unknown' {
  if (band === '2ghz') return 2.4;
  if (band === '5ghz') return 5;
  if (band === '6ghz') return 6;
  return 'unknown';
}

/** Синоним normalizeBand — полоса канала. */
export function band(channelBand: CoreWlanChannelBand): BandGhz | 'unknown' {
  return normalizeBand(channelBand);
}

/** Нормализация `CWChannelWidth` → МГц. */
export function normalizeWidth(width: CoreWlanChannelWidth): ChannelWidthMhz | 'unknown' {
  if (width === '20mhz') return 20;
  if (width === '40mhz') return 40;
  if (width === '80mhz') return 80;
  if (width === '160mhz') return 160;
  return 'unknown';
}

/**
 * Центр 20 МГц primary, МГц.
 * 2.4: 2407+5n (ch14 = 2484); 5: 5000+5n; 6: 5950+5n.
 */
export function primaryCenterMhz(
  bandGhz: BandGhz | 'unknown',
  channelNumber: number
): number | null {
  if (!Number.isFinite(channelNumber) || channelNumber <= 0) return null;
  if (bandGhz === 2.4) {
    if (channelNumber === 14) return 2484;
    if (channelNumber >= 1 && channelNumber <= 13) return 2407 + 5 * channelNumber;
    return null;
  }
  if (bandGhz === 5) return 5000 + 5 * channelNumber;
  if (bandGhz === 6) return 5950 + 5 * channelNumber;
  return null;
}

/**
 * Поддиапазон UNII по частоте primary-центра.
 * Полуинтервалы [from, to); UNII-8 включает 7125.
 */
export function uniiSubbandFromMhz(mhz: number): UniiSubband {
  if (!Number.isFinite(mhz)) return 'none';
  for (const row of UNII_SUBBAND_TABLE) {
    const last = row.id === 'unii-8';
    if (mhz >= row.fromMhz && (last ? mhz <= row.toMhz : mhz < row.toMhz)) {
      return row.id;
    }
  }
  return 'none';
}

/** UNII по полосе и номеру primary-канала. 2.4 → none. */
export function uniiSubband(bandGhz: BandGhz | 'unknown', channelNumber: number): UniiSubband {
  if (bandGhz === 2.4 || bandGhz === 'unknown') return 'none';
  const mhz = primaryCenterMhz(bandGhz, channelNumber);
  if (mhz == null) return 'none';
  return uniiSubbandFromMhz(mhz);
}

/** DFS: UNII-2A и UNII-2C. */
export function isDfsUnii(subband: UniiSubband): boolean {
  return subband === 'unii-2a' || subband === 'unii-2c';
}

/** 20 МГц span primary-канала. */
export function primarySpanMhz(
  bandGhz: BandGhz | 'unknown',
  channelNumber: number
): FrequencySpanMhz | null {
  const center = primaryCenterMhz(bandGhz, channelNumber);
  if (center == null) return null;
  return { from: center - WIDTH_HALF_MHZ[20], to: center + WIDTH_HALF_MHZ[20] };
}

/** Перекрытие двух частотных отрезков, МГц. */
export function overlapMhz(a: FrequencySpanMhz, b: FrequencySpanMhz): number {
  return Math.max(0, Math.min(a.to, b.to) - Math.max(a.from, b.from));
}

/** Span вокруг центра по ширине. */
export function spanAround(center: number, width: ChannelWidthMhz): FrequencySpanMhz {
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

/** 6 ГГц: каналы 1, 5, 9, …; блоки 40/80/160 не перекрываются. */
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

/** Occupying-центр по стандартной раскладке (approximation без IE). */
export function standardLayoutOccupyingMhz(
  bandGhz: BandGhz | 'unknown',
  channelNumber: number,
  primaryMhz: number,
  width: 40 | 80 | 160
): number | null {
  if (bandGhz === 2.4) return guess24GhzOccupying(channelNumber, primaryMhz, width);
  if (bandGhz === 5) return guess5GhzOccupying(channelNumber, width);
  if (bandGhz === 6) return guess6GhzOccupying(channelNumber, width);
  return null;
}

function occupyingFromIe(
  bandGhz: BandGhz | 'unknown',
  width: ChannelWidthMhz,
  primaryMhz: number,
  ie: ShallowIeView
): number | null {
  if (width === 40 && (ie.htSecondaryOffset === 1 || ie.htSecondaryOffset === -1)) {
    return primaryMhz + 10 * ie.htSecondaryOffset;
  }
  if ((width === 40 || width === 80 || width === 160) && ie.ccfs0 != null && ie.ccfs0 > 0) {
    return primaryCenterMhz(bandGhz, ie.ccfs0);
  }
  return null;
}

function finishWide(
  number: number,
  bandGhz: BandGhz | 'unknown',
  widthMhz: ChannelWidthMhz,
  primary: number,
  occupying: number | null,
  centerConfidence: ChannelCenterConfidence
): ChannelView {
  return {
    number,
    band: bandGhz,
    widthMhz,
    primaryCenterMhz: primary,
    occupyingCenterMhz: occupying,
    occupyingSpanMhz: occupying != null ? spanAround(occupying, widthMhz) : null,
    centerConfidence,
  };
}

/**
 * ChannelView: полоса, primary-центр IEEE, occupying (IE или standard-layout).
 */
export function computeChannelView(
  channelNumber: number | null,
  channelBand: CoreWlanChannelBand,
  channelWidth: CoreWlanChannelWidth,
  ie: ShallowIeView | null = ABSENT_IE
): ChannelView {
  const number = channelNumber != null && Number.isFinite(channelNumber) ? channelNumber : 0;
  const bandGhz = normalizeBand(channelBand);
  const widthMhz = normalizeWidth(channelWidth);
  const primary = primaryCenterMhz(bandGhz, number);
  const ieView = ie ?? ABSENT_IE;

  if (primary == null) {
    return {
      number,
      band: bandGhz,
      widthMhz,
      primaryCenterMhz: null,
      occupyingCenterMhz: null,
      occupyingSpanMhz: null,
      centerConfidence:
        widthMhz === 20 || widthMhz === 'unknown' ? 'ieee-primary-20' : 'standard-layout-guess',
    };
  }

  if (widthMhz === 20 || widthMhz === 'unknown') {
    return {
      number,
      band: bandGhz,
      widthMhz,
      primaryCenterMhz: primary,
      occupyingCenterMhz: primary,
      occupyingSpanMhz: widthMhz === 20 ? spanAround(primary, 20) : null,
      centerConfidence: 'ieee-primary-20',
    };
  }

  const fromIe = occupyingFromIe(bandGhz, widthMhz, primary, ieView);
  if (fromIe != null) {
    return finishWide(number, bandGhz, widthMhz, primary, fromIe, 'ie-operation');
  }

  const guessed = standardLayoutOccupyingMhz(bandGhz, number, primary, widthMhz);
  return finishWide(number, bandGhz, widthMhz, primary, guessed, 'standard-layout-guess');
}

/**
 * Занимаемый отрезок частоты BSS.
 * Если occupyingSpan нет — primary ± половина ширины (unknown → 20 МГц).
 */
export function occupyingSpanOf(view: ChannelView): FrequencySpanMhz | null {
  if (view.occupyingSpanMhz) return view.occupyingSpanMhz;
  const center = view.occupyingCenterMhz ?? view.primaryCenterMhz;
  if (center == null) return null;
  const width: ChannelWidthMhz = view.widthMhz === 'unknown' ? 20 : view.widthMhz;
  return spanAround(center, width);
}

/** Каналы сетки визуализации для полосы. */
export function channelsForBand(bandGhz: BandGhz): readonly number[] {
  if (bandGhz === 2.4) return BAND_24_CHANNELS;
  if (bandGhz === 5) return BAND_5_CHANNELS;
  return BAND_6_CHANNELS;
}
