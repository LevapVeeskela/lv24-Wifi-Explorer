import type { BandGhz } from '@/domain/channel';

export type UniiLabel =
  | 'UNII-1'
  | 'UNII-2A'
  | 'UNII-2C'
  | 'UNII-3'
  | 'UNII-4'
  | 'UNII-5'
  | 'UNII-6'
  | 'UNII-7'
  | 'UNII-8';

export function uniiSubband(band: BandGhz | 'unknown' | number, channel: number): UniiLabel | null {
  if (band === 5) {
    if (channel >= 36 && channel <= 48) return 'UNII-1';
    if (channel >= 52 && channel <= 64) return 'UNII-2A';
    if (channel >= 100 && channel <= 144) return 'UNII-2C';
    if (channel >= 149 && channel <= 165) return 'UNII-3';
    if (channel >= 169 && channel <= 177) return 'UNII-4';
  }
  if (band === 6) {
    if (channel >= 1 && channel <= 93) return 'UNII-5';
    if (channel >= 97 && channel <= 113) return 'UNII-6';
    if (channel >= 117 && channel <= 185) return 'UNII-7';
    if (channel >= 189 && channel <= 233) return 'UNII-8';
  }
  return null;
}

export function formatBandWithUnii(band: BandGhz | 'unknown' | number, channel: number): string {
  if (band === 'unknown' || typeof band !== 'number') return '—';
  const unii = uniiSubband(band, channel);
  const label = `${band} GHz`;
  return unii ? `${label} ${unii}` : label;
}
