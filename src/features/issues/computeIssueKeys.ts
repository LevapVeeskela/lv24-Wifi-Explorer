import type { ObservedBss } from '@/domain/bss';
import type { MessageKey } from '@/shared/i18n';

export function computeIssueKeys(bss: ObservedBss, all: readonly ObservedBss[]): MessageKey[] {
  const keys: MessageKey[] = [];
  const channel = bss.channel.number;
  const band = bss.channel.band;

  if (bss.identity.ssid.status === 'available' && bss.identity.ssid.value.hidden) {
    keys.push('scan.issue.hidden');
  }

  if (bss.security.primary === 'wep' || bss.security.primary === 'open') {
    keys.push('scan.issue.weakSecurity');
  }

  if (bss.signal.rssiDbm <= -85) {
    keys.push('scan.issue.lowRssi');
  }

  if (band === 2.4 && bss.channel.widthMhz === 40) {
    keys.push('scan.issue.width40on24');
  }

  const sameChannel = all.filter(
    (other) =>
      other.channel.number === channel &&
      other.channel.band === band &&
      other !== bss
  );
  if (sameChannel.length >= 4) {
    keys.push('scan.issue.crowded');
  }

  const overlaps = all.some((other) => {
    if (other === bss) return false;
    if (other.channel.band !== band) return false;
    const width = typeof bss.channel.widthMhz === 'number' ? bss.channel.widthMhz : 20;
    const otherWidth = typeof other.channel.widthMhz === 'number' ? other.channel.widthMhz : 20;
    const half = width / 2;
    const otherHalf = otherWidth / 2;
    const center = bss.channel.number;
    const otherCenter = other.channel.number;
    return Math.abs(center - otherCenter) * 5 < half + otherHalf;
  });
  if (overlaps) {
    keys.push('scan.issue.overlap');
  }

  if (bss.identity.ssid.status !== 'available') {
    return keys;
  }
  const ssidIdentity = bss.identity.ssid.value;
  const ssidOctets = ssidIdentity.octetHex;
  if (ssidOctets && !ssidIdentity.hidden) {
    const sameSsid = all.filter(
      (other) =>
        other.identity.ssid.status === 'available' &&
        other.identity.ssid.value.octetHex === ssidOctets
    );
    const bands = new Set(
      sameSsid.map((row) => row.channel.band).filter((b) => b !== 'unknown')
    );
    if (bands.size === 1 && bands.has(2.4)) {
      keys.push('scan.issue.band24only');
    }
  }

  return keys;
}
