import { describe, expect, it } from 'vitest';
import {
  isLocallyAdministered,
  isMulticastMac,
  isRandomizedMac,
  ouiFromBssid,
  vendorFlagsFromBssid,
} from './vendor';

describe('vendor U/L bit', () => {
  it('marks randomized when locally administered bit is set', () => {
    expect(isLocallyAdministered('00:11:22:33:44:55')).toBe(false);
    expect(isRandomizedMac('00:11:22:33:44:55')).toBe(false);
    expect(isLocallyAdministered('02:11:22:33:44:55')).toBe(true);
    expect(isRandomizedMac('02:11:22:33:44:55')).toBe(true);
    expect(isLocallyAdministered('03:11:22:33:44:55')).toBe(true);
    expect(isMulticastMac('03:11:22:33:44:55')).toBe(true);
  });

  it('does not assign an organization to randomized MAC', () => {
    const flags = vendorFlagsFromBssid('02:11:22:aa:bb:cc');
    expect(flags.match).toBe('randomized');
    expect(flags.locallyAdministered).toBe(true);
    expect(flags.oui).toBe('02:11:22');
    expect(ouiFromBssid('AA-BB-CC-DD-EE-FF')).toBe('aa:bb:cc');
  });
});
