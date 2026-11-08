import type { ObservedBss } from '@/domain/bss';

export function bssidOfNetwork(bss: ObservedBss): string | null {
  const gated = bss.identity?.bssid;
  if (!gated || gated.status !== 'available') return null;
  const value = gated.value;
  return typeof value === 'string' && value.trim() ? value : null;
}
