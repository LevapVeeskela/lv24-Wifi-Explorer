import type { SignalQuality } from '@/domain/signal';
import type { SecurityKind } from '@/domain/security';
import type { MessageKey } from '@/shared/i18n';

export function qualityMessageKey(quality: SignalQuality): MessageKey {
  switch (quality) {
    case 'excellent':
      return 'scan.quality.excellent';
    case 'good':
      return 'scan.quality.good';
    case 'fair':
      return 'scan.quality.fair';
    case 'poor':
      return 'scan.quality.poor';
    case 'unusable':
      return 'scan.quality.unusable';
    default:
      return 'scan.quality.none';
  }
}

/** Progress fill 0–100 from RSSI (−100…−30 typical). */
export function rssiToBarPercent(rssiDbm: number): number {
  const clamped = Math.min(-30, Math.max(-100, rssiDbm));
  return Math.round(((clamped + 100) / 70) * 100);
}

export function formatDbm(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value} dBm`;
}

export function formatSnr(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(1)} dB`;
}

export function formatChannelWidth(width: number | 'unknown'): string {
  if (width === 'unknown') return '—';
  return `${width} MHz`;
}

export function formatBandLabel(band: number | 'unknown'): string {
  if (band === 'unknown') return '—';
  return `${band} GHz`;
}

export function securityDisplayLabel(primary: SecurityKind): string {
  switch (primary) {
    case 'open':
      return 'Open';
    case 'wep':
      return 'WEP';
    case 'wpa2-personal':
      return 'WPA2-Personal';
    case 'wpa3-personal':
      return 'WPA3-Personal';
    case 'wpa3-transition':
      return 'WPA3 transition';
    case 'wpa-personal':
    case 'wpa-personal-mixed':
      return 'WPA-Personal';
    case 'owe':
      return 'OWE';
    case 'wpa2-enterprise':
      return 'WPA2-Enterprise';
    default:
      return primary.replace(/-/g, ' ');
  }
}

export function truncateBssidMiddle(bssid: string, head = 8, tail = 5): string {
  if (bssid.length <= head + tail + 1) return bssid;
  return `${bssid.slice(0, head)}…${bssid.slice(-tail)}`;
}

export function vendorInitials(name: string | null): string {
  if (!name) return '?';
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0]![0]! + words[1]![0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
