/**
 * PHY mode и оценка max rate.
 *
 * `CWNetwork.supportsPHYMode:` — заявленные режимы BSS (из scan record),
 * не MCS текущего кадра. `CWInterface.activePHYMode` / `transmitRate` —
 * только для ассоциированного интерфейса.
 *
 * Без NSS/GI/MCS из IE нельзя честно назвать одну скорость. Даём диапазон
 * 1 SS + long GI (потолок PHY), без ложной точности «866.7 Mbps».
 */

/** Соответствует `CWPHYMode`. */
export type PhyLetter = 'a' | 'b' | 'g' | 'n' | 'ac' | 'ax' | 'be';

export type PhyDisplay = string & { readonly __brand: 'PhyDisplay' };

export interface PhyView {
  /** Все `supportsPHYMode:` === YES, порядок: b, a, g, n, ac, ax, be. */
  supported: readonly PhyLetter[];
  highest: PhyLetter | null;
  /**
   * Строка в духе `g/n` или `a/n/ac/ax`.
   * Пустая, если ни один флаг не выставлен.
   */
  display: PhyDisplay | '';
  source: 'api-supportsPHYMode';
}

export type RateBasis =
  /** Только highest PHY + ширина канала, 1 SS, long GI. */
  | 'phy-width-1ss-long-gi'
  /** MCS map из HT/VHT/HE caps в IE (если байты есть и разобраны). */
  | 'ie-nss-mcs';

/**
 * Оценка, не throughput. `mbpsLow` = консервативный 1 SS;
 * `mbpsHigh` заполняется только при ie-nss-mcs, иначе null.
 */
export interface MaxRateEstimate {
  mbpsLow: number;
  mbpsHigh: number | null;
  basis: RateBasis;
  nssUsed: 1 | 2 | 3 | 4 | 6 | 8;
  /** Всегда напоминание: это не скорость линка и не airtime. */
  disclaimer: 'not-a-link-speed';
}

export {
  MAX_RATE_1SS_LONG_GI_MBPS,
  estimateMaxRateFromMcs,
  estimatePhyMaxRate,
  lookupMcsMbps,
  toMaxRateEstimate,
} from './phy-rates';
export type {
  EstimatePhyMaxRateInput,
  McsFamily,
  McsLookupQuery,
  PhyMaxRateResult,
  PhyMaxRateUnknownReason,
} from './phy-rates';

export const PHY_DISPLAY_ORDER: readonly PhyLetter[] = [
  'b',
  'a',
  'g',
  'n',
  'ac',
  'ax',
  'be',
];
