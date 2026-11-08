/**
 * Сигнал: RSSI, noise, SNR, качественные ярлыки.
 *
 * SNR = rssi − noise (оба dBm). Это derived, не approximation.
 * Ярлыки качества — эвристика UI, не IEEE и не «процент».
 *
 * `noiseMeasurement == 0` у CoreWLAN часто значит «нет замера»
 * (ошибка / не в сети у интерфейса). Для BSS скана 0 считаем невалидным.
 */

export type SignalQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unusable';

export type QualityBasis = 'snr' | 'rssi-fallback';

export interface SignalView {
  /** `CWNetwork.rssiValue`, dBm (обычно отрицательный). */
  rssiDbm: number;
  /** `CWNetwork.noiseMeasurement`; null, если замер невалиден. */
  noiseDbm: number | null;
  /** rssi − noise; null, если noise невалиден. */
  snrDb: number | null;
  quality: SignalQuality;
  qualityBasis: QualityBasis;
}

/** noise валиден только в типичном диапазоне приёмника. */
export const NOISE_VALID_DBM = { min: -120, max: -20 } as const;

/**
 * Пороги SNR (dB), нижняя граница включительно.
 * Ниже 10 → unusable. Эвристика, не спецификация.
 */
export const SNR_QUALITY_MIN_DB: Record<SignalQuality, number> = {
  excellent: 40,
  good: 25,
  fair: 15,
  poor: 10,
  unusable: Number.NEGATIVE_INFINITY,
};

/**
 * Fallback по RSSI (dBm), если noise нет.
 * Ниже −90 → unusable.
 */
export const RSSI_QUALITY_MIN_DBM: Record<SignalQuality, number> = {
  excellent: -50,
  good: -60,
  fair: -70,
  poor: -80,
  unusable: Number.NEGATIVE_INFINITY,
};

/** Нижний конец линейного % (0%). */
export const PERCENT_ZERO_DBM = -100;

/** Верхний конец линейного % (100%). */
export const PERCENT_FULL_DBM = -50;

const QUALITY_ORDER: readonly SignalQuality[] = ['excellent', 'good', 'fair', 'poor', 'unusable'];

/**
 * Noise валиден только в типичном диапазоне приёмника.
 * `0` у CoreWLAN часто значит «нет замера» — невалиден.
 */
export function isNoiseValid(noiseDbm: number): boolean {
  return (
    Number.isFinite(noiseDbm) && noiseDbm >= NOISE_VALID_DBM.min && noiseDbm <= NOISE_VALID_DBM.max
  );
}

/**
 * SNR в dB: rssi − noise.
 * @returns null, если noise невалиден (0 / вне −120…−20).
 */
export function snr(rssiDbm: number, noiseDbm: number): number | null {
  if (!Number.isFinite(rssiDbm) || !isNoiseValid(noiseDbm)) return null;
  return rssiDbm - noiseDbm;
}

/** Ярлык по таблице: берём высший ярус, где value ≥ порога. */
export function qualityFromTable(
  value: number,
  table: Record<SignalQuality, number>
): SignalQuality {
  for (const label of QUALITY_ORDER) {
    if (value >= table[label]) return label;
  }
  return 'unusable';
}

/**
 * Качество: сначала SNR, иначе fallback по RSSI.
 * Эвристика UI, не процент и не IEEE.
 */
export function quality(rssiDbm: number, noiseDbm: number): SignalQuality {
  const snrDb = snr(rssiDbm, noiseDbm);
  if (snrDb != null) return qualityFromTable(snrDb, SNR_QUALITY_MIN_DB);
  return qualityFromTable(rssiDbm, RSSI_QUALITY_MIN_DBM);
}

/** Основание ярлыка: SNR при валидном noise, иначе RSSI. */
export function qualityBasisOf(noiseDbm: number): QualityBasis {
  return isNoiseValid(noiseDbm) ? 'snr' : 'rssi-fallback';
}

/**
 * Линейный % из dBm: clamp в [0, 100].
 * По умолчанию zero=−100 → 0%, full=−50 → 100%. Отрицательный % не возвращаем.
 */
export function percentFromDbm(
  dbm: number,
  zeroDbm: number = PERCENT_ZERO_DBM,
  fullDbm: number = PERCENT_FULL_DBM
): number {
  if (!Number.isFinite(dbm) || !Number.isFinite(zeroDbm) || !Number.isFinite(fullDbm)) {
    return 0;
  }
  const span = fullDbm - zeroDbm;
  if (span === 0) return 0;
  const raw = (100 * (dbm - zeroDbm)) / span;
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/** Собрать SignalView из сырых RSSI/noise CoreWLAN. */
export function computeSignalView(rssiDbm: number, noiseRaw: number): SignalView {
  const noiseDbm = isNoiseValid(noiseRaw) ? noiseRaw : null;
  const snrDb = noiseDbm != null ? rssiDbm - noiseDbm : null;
  return {
    rssiDbm,
    noiseDbm,
    snrDb,
    quality: quality(rssiDbm, noiseRaw),
    qualityBasis: qualityBasisOf(noiseRaw),
  };
}
