import type { ObservedBss } from '@/domain/bss';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import { formatChannelWidth, formatDbm, securityDisplayLabel } from '@/entities/bss/formatters';
import { formatBandWithUnii } from '@/features/channel-occupancy/unii';
import type { SecurityKind } from '@/domain/security';

export function formatPhyMode(phyMode: string): string {
  if (!phyMode || phyMode === '—') return '—';
  if (phyMode.startsWith('802.11')) return phyMode;
  return `802.11${phyMode}`;
}

export function formatMaxRate(bss: ObservedBss): string {
  const rate = bss.maxRate;
  if (!rate) return '—';
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  if (rate.mbpsHigh != null && rate.mbpsHigh !== rate.mbpsLow) {
    return `${fmt(rate.mbpsLow)}–${fmt(rate.mbpsHigh)} Mbps`;
  }
  return `${fmt(rate.mbpsLow)} Mbps`;
}

export function formatEncryption(bss: ObservedBss): { value: string; unavailable: boolean } {
  if (bss.security.primary === 'wep' || bss.security.primary === 'dynamic-wep') {
    return { value: 'WEP', unavailable: false };
  }
  if (bss.security.primary === 'open') {
    return { value: '—', unavailable: false };
  }
  return { value: '—', unavailable: true };
}

export function formatSnrDetails(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(2)} dB`;
}

export function formatFrequency(bss: ObservedBss): string {
  const mhz = bss.channel.primaryCenterMhz;
  if (mhz == null || !Number.isFinite(mhz)) return '—';
  return `${mhz} MHz`;
}

export function formatCountry(bss: ObservedBss): { value: string; unavailable: boolean } {
  if (bss.countryCode.status === 'redacted') {
    return { value: '—', unavailable: true };
  }
  const value = bss.countryCode.value ?? bss.ie.countryFromIe;
  return { value: value || '—', unavailable: !value };
}

export function formatSignalPct(pct: number): string {
  return `${pct}%`;
}

export function formatNoiseDbm(value: number | null | undefined): string {
  return formatDbm(value);
}

export function formatSecurity(row: ScanGridRow): string {
  return securityDisplayLabel(row.securityLabel as SecurityKind);
}

export function formatBandField(row: ScanGridRow): string {
  return formatBandWithUnii(row.band, row.channel);
}

export function formatWidthField(row: ScanGridRow): string {
  return formatChannelWidth(row.channelWidth);
}

export function formatRelativeSeen(iso: string, nowMs = Date.now()): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return '—';
  const sec = Math.max(0, Math.round((nowMs - then) / 1000));
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  return `${Math.round(sec / 3600)}h`;
}
