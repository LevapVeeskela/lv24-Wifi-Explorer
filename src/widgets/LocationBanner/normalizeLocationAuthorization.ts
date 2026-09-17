import type { LocationAuthorization } from '@/domain/identity';

const KNOWN: readonly LocationAuthorization[] = [
  'granted',
  'denied',
  'not-determined',
  'restricted',
];

export function normalizeLocationAuthorization(value: string): LocationAuthorization {
  if (KNOWN.includes(value as LocationAuthorization)) {
    return value as LocationAuthorization;
  }
  return 'not-determined';
}
