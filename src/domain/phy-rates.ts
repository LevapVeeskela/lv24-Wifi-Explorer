/**
 * Публичные MCS-таблицы IEEE 802.11n/ac/ax × NSS × ширина × long GI.
 *
 * HT/VHT long GI = 800 ns. HE long GI = 3.2 μs (самый длинный GI в ax).
 * Short GI не считаем: VHT 80 МГц 2SS MCS9 short GI = 866.7 — эту цифру
 * не подставляем никогда.
 *
 * EHT / 320 МГц не оцениваем: в CoreWLAN нет CWChannelWidth 320.
 */

import type { ChannelWidthMhz } from './channel';
import type { MaxRateEstimate, PhyLetter, RateBasis } from './phy';

export type McsFamily = 'ht' | 'vht' | 'he';
export type LongGi = 'long';
export type SpatialStreams = 1 | 2 | 3 | 4 | 6 | 8;

/**
 * Потолок Mbps, 1 spatial stream, long GI.
 * Округление до целого. 11b/g/a — фиксированные IEEE maxima.
 * be (EHT) в v1 не оцениваем.
 *
 * HT = MCS7; VHT 20/40 = MCS8, 80/160 = MCS9; HE = MCS9 (не MCS11,
 * пока IE map не сказал иначе).
 */
export const MAX_RATE_1SS_LONG_GI_MBPS = {
  b: { 20: 11 },
  g: { 20: 54 },
  a: { 20: 54 },
  n: { 20: 65, 40: 135 },
  ac: { 20: 78, 40: 162, 80: 390, 160: 780 },
  ax: { 20: 115, 40: 229, 80: 480, 160: 960 },
} as const;

/** HT MCS 0–7, 1 SS, long GI (800 ns). NSS > 1 = линейно. */
export const HT_MCS_1SS_LONG_GI_MBPS: Record<20 | 40, readonly number[]> = {
  20: [6.5, 13, 19.5, 26, 39, 52, 58.5, 65],
  40: [13.5, 27, 40.5, 54, 81, 108, 121.5, 135],
};

/**
 * VHT MCS 0–9, 1 SS, long GI. `null` = комбинация невалидна при 1 SS
 * (MCS9 @ 20 МГц). См. также `isVhtMcsValid` для NSS 3/6 @ 20 МГц.
 */
export const VHT_MCS_1SS_LONG_GI_MBPS: Record<
  20 | 40 | 80 | 160,
  readonly (number | null)[]
> = {
  20: [6.5, 13, 19.5, 26, 39, 52, 58.5, 65, 78, null],
  40: [13.5, 27, 40.5, 54, 81, 108, 121.5, 135, 162, 180],
  80: [29.3, 58.5, 87.8, 117, 175.5, 234, 263.3, 292.5, 351, 390],
  160: [58.5, 117, 175.5, 234, 351, 468, 526.5, 585, 702, 780],
};

/** HE MCS 0–11, 1 SS, GI 3.2 μs. Публичная таблица 802.11ax. */
export const HE_MCS_1SS_LONG_GI_MBPS: Record<20 | 40 | 80 | 160, readonly number[]> = {
  20: [8.6, 17.2, 25.8, 34.4, 51.6, 68.8, 77.4, 86.0, 103.2, 114.7, 129.0, 143.4],
  40: [17.2, 34.4, 51.6, 68.8, 103.2, 137.6, 154.9, 172.1, 206.5, 229.4, 258.1, 286.8],
  80: [36.0, 72.1, 108.1, 144.1, 216.2, 288.2, 324.3, 360.3, 432.4, 480.4, 540.4, 600.4],
  160: [72.1, 144.1, 216.2, 288.2, 432.4, 576.5, 648.5, 720.6, 864.7, 960.7, 1080.9, 1201.0],
};

export type PhyMaxRateStatus = 'known' | 'range' | 'unknown';

export type PhyMaxRateUnknownReason =
  | 'missing-phy'
  | 'eht-unsupported'
  | 'width-unsupported'
  | 'short-gi-unsupported';

export type PhyMaxRateResult =
  | {
      status: 'known';
      mbps: number;
      mbps1ss: number;
      nss: SpatialStreams;
      family: McsFamily | null;
      widthMhz: ChannelWidthMhz;
      gi: LongGi;
    }
  | {
      status: 'range';
      mbpsLow: number;
      /** null = верх неизвестен (нет NSS), не подставляем 4×2 «866.7». */
      mbpsHigh: number | null;
      nss: SpatialStreams | null;
      family: McsFamily | null;
      widthMhz: ChannelWidthMhz;
      gi: LongGi;
    }
  | {
      status: 'unknown';
      reason: PhyMaxRateUnknownReason;
    };

export interface McsLookupQuery {
  family: McsFamily;
  mcs: number;
  nss: SpatialStreams;
  widthMhz: ChannelWidthMhz;
  gi?: LongGi | 'short';
}

/**
 * IEEE 802.11ac: MCS9 @ 20 МГц валиден только для NSS 3 и 6;
 * MCS6 @ 80 МГц невалиден для NSS 3 и 6.
 */
export function isVhtMcsValid(mcs: number, nss: SpatialStreams, widthMhz: ChannelWidthMhz): boolean {
  if (mcs < 0 || mcs > 9) return false;
  if (mcs === 9 && widthMhz === 20 && nss !== 3 && nss !== 6) return false;
  if (mcs === 6 && widthMhz === 80 && (nss === 3 || nss === 6)) return false;
  return true;
}

function widthSupported(family: McsFamily, widthMhz: ChannelWidthMhz): boolean {
  if (family === 'ht') return widthMhz === 20 || widthMhz === 40;
  return widthMhz === 20 || widthMhz === 40 || widthMhz === 80 || widthMhz === 160;
}

/**
 * Точное значение из публичной таблицы, Mbps.
 * Short GI / EHT / невалидный MCS → null (не 866.7).
 */
export function lookupMcsMbps(query: McsLookupQuery): number | null {
  if (query.gi === 'short') return null;
  const { family, mcs, nss, widthMhz } = query;
  if (!widthSupported(family, widthMhz)) return null;

  if (family === 'ht') {
    if (nss === 8) return null;
    if (widthMhz !== 20 && widthMhz !== 40) return null;
    const row = HT_MCS_1SS_LONG_GI_MBPS[widthMhz];
    if (mcs < 0 || mcs >= row.length) return null;
    return row[mcs] * nss;
  }

  if (family === 'vht') {
    if (!isVhtMcsValid(mcs, nss, widthMhz)) return null;
    const row = VHT_MCS_1SS_LONG_GI_MBPS[widthMhz];
    const base = row[mcs];
    if (base == null) {
      // MCS9 @ 20 МГц, 1 SS в таблице null; NSS 3/6 — 86.7 × NSS.
      if (mcs === 9 && widthMhz === 20 && (nss === 3 || nss === 6)) return 86.7 * nss;
      return null;
    }
    return base * nss;
  }

  if (mcs < 0 || mcs > 11) return null;
  const row = HE_MCS_1SS_LONG_GI_MBPS[widthMhz];
  return row[mcs] * nss;
}

type RatePhy = keyof typeof MAX_RATE_1SS_LONG_GI_MBPS;

function familyOfRatePhy(phy: RatePhy): McsFamily | null {
  if (phy === 'n') return 'ht';
  if (phy === 'ac') return 'vht';
  if (phy === 'ax') return 'he';
  return null;
}

function lookup1ssCeiling(phy: RatePhy, width: ChannelWidthMhz | 'unknown'): number | null {
  const table = MAX_RATE_1SS_LONG_GI_MBPS[phy] as Partial<Record<ChannelWidthMhz, number>>;
  const target: ChannelWidthMhz = width === 'unknown' ? 20 : width;
  const descending: ChannelWidthMhz[] = [160, 80, 40, 20];
  for (const w of descending) {
    if (w > target) continue;
    const rate = table[w];
    if (rate != null) return rate;
  }
  return null;
}

const RATE_PHY_ORDER: readonly RatePhy[] = ['b', 'a', 'g', 'n', 'ac', 'ax'];

function pickRatePhy(supported: readonly PhyLetter[]): RatePhy | null {
  let found: RatePhy | null = null;
  for (const letter of RATE_PHY_ORDER) {
    if (supported.includes(letter)) found = letter;
  }
  return found;
}

export interface EstimatePhyMaxRateInput {
  supported: readonly PhyLetter[];
  widthMhz: ChannelWidthMhz | 'unknown' | 320;
  nss: SpatialStreams | null;
  /** Если есть из VHT/HE MCS map; иначе консервативный потолок таблицы 1SS. */
  maxMcs?: number | null;
  gi?: LongGi | 'short';
}

/**
 * Оценка max rate: long GI only.
 * NSS неизвестен → range (1SS … null), не «866.7».
 * Только `be` / 320 / short GI → unknown.
 */
export function estimatePhyMaxRate(input: EstimatePhyMaxRateInput): PhyMaxRateResult {
  if (input.gi === 'short') return { status: 'unknown', reason: 'short-gi-unsupported' };
  if (input.widthMhz === 320) return { status: 'unknown', reason: 'eht-unsupported' };
  if (input.supported.includes('be') && input.supported.every((p) => p === 'be')) {
    return { status: 'unknown', reason: 'eht-unsupported' };
  }

  const ratePhy = pickRatePhy(input.supported);
  if (!ratePhy) return { status: 'unknown', reason: 'missing-phy' };

  const width: ChannelWidthMhz = input.widthMhz === 'unknown' ? 20 : input.widthMhz;
  const family = familyOfRatePhy(ratePhy);
  const ceiling1ss = lookup1ssCeiling(ratePhy, width);
  if (ceiling1ss == null) return { status: 'unknown', reason: 'width-unsupported' };

  if (family == null) {
    // a/b/g — фиксированный IEEE max, не MCS и не × NSS.
    if (input.nss == null) {
      return {
        status: 'range',
        mbpsLow: ceiling1ss,
        mbpsHigh: null,
        nss: null,
        family: null,
        widthMhz: 20,
        gi: 'long',
      };
    }
    return {
      status: 'known',
      mbps: ceiling1ss,
      mbps1ss: ceiling1ss,
      nss: 1,
      family: null,
      widthMhz: 20,
      gi: 'long',
    };
  }

  let mbps1ss = ceiling1ss;
  let mbpsNss: number | null = input.nss == null ? null : ceiling1ss * input.nss;

  if (input.maxMcs != null && input.nss != null) {
    const exact1 = lookupMcsMbps({
      family,
      mcs: input.maxMcs,
      nss: 1,
      widthMhz: width,
      gi: 'long',
    });
    const exactN = lookupMcsMbps({
      family,
      mcs: input.maxMcs,
      nss: input.nss,
      widthMhz: width,
      gi: 'long',
    });
    if (exact1 != null) mbps1ss = exact1;
    if (exactN != null) mbpsNss = exactN;
  } else if (input.maxMcs != null && input.nss == null) {
    const exact1 = lookupMcsMbps({
      family,
      mcs: input.maxMcs,
      nss: 1,
      widthMhz: width,
      gi: 'long',
    });
    if (exact1 != null) mbps1ss = exact1;
  }

  if (input.nss == null) {
    return {
      status: 'range',
      mbpsLow: mbps1ss,
      mbpsHigh: null,
      nss: null,
      family,
      widthMhz: width,
      gi: 'long',
    };
  }

  return {
    status: 'known',
    mbps: mbpsNss ?? mbps1ss * input.nss,
    mbps1ss,
    nss: input.nss,
    family,
    widthMhz: width,
    gi: 'long',
  };
}

/** В `MaxRateEstimate`: 1SS = low; high только при известном NSS. */
export function toMaxRateEstimate(result: PhyMaxRateResult): MaxRateEstimate | null {
  if (result.status === 'unknown') return null;

  if (result.status === 'range') {
    const basis: RateBasis = 'phy-width-1ss-long-gi';
    return {
      mbpsLow: result.mbpsLow,
      mbpsHigh: result.mbpsHigh,
      basis,
      nssUsed: 1,
      disclaimer: 'not-a-link-speed',
    };
  }

  return {
    mbpsLow: result.mbps1ss,
    mbpsHigh: result.mbps,
    basis: 'ie-nss-mcs',
    nssUsed: result.nss,
    disclaimer: 'not-a-link-speed',
  };
}

export function estimateMaxRateFromMcs(input: EstimatePhyMaxRateInput): MaxRateEstimate | null {
  return toMaxRateEstimate(estimatePhyMaxRate(input));
}
