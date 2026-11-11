import { describe, expect, it } from 'vitest';
import {
  parseIwCapabilities,
  parseNetshCapabilities,
  parseSystemProfilerCapabilities,
} from './adapterCapabilities';

describe('adapter capability parsers', () => {
  it('reads netsh radio types, bands, width and security', () => {
    const caps = parseNetshCapabilities(`
Interface name: Wi-Fi
Radio types supported : 802.11b 802.11g 802.11n 802.11a 802.11ac 802.11ax
6 GHz band supported : Yes
Authentication and cipher supported in infrastructure mode:
Open None
WPA2-Personal CCMP
WPA3-Personal GCMP
`);
    expect(caps.phy).toEqual(expect.arrayContaining(['b', 'g', 'n', 'a', 'ac', 'ax']));
    expect(caps.bands).toEqual(expect.arrayContaining([2.4, 5, 6]));
    expect(caps.maxWidthMhz).toBe(160);
    expect(caps.security).toEqual(
      expect.arrayContaining(['open', 'wpa2-personal', 'wpa3-personal'])
    );
    expect(caps.source).toBe('netsh');
  });

  it('reads iw bands and HE width without 802.11 tokens', () => {
    const caps = parseIwCapabilities(`
Band 1:
  Frequencies:
    2412 MHz [1]
Band 2:
  Frequencies:
    5180 MHz [36]
  VHT Capabilities
  HE IEs
  Supported Channel Width: 160 MHz
`);
    expect(caps.bands).toEqual(expect.arrayContaining([2.4, 5]));
    expect(caps.phy).toEqual(expect.arrayContaining(['ac', 'ax', 'n']));
    expect(caps.maxWidthMhz).toBe(160);
    expect(caps.source).toBe('iw');
  });

  it('reads macOS system_profiler PHY modes and bands', () => {
    const caps = parseSystemProfilerCapabilities(`
Supported PHY Modes: 802.11 a/b/g/n/ac/ax
Supported Channels: 2GHz, 5GHz
`);
    expect(caps.bands).toEqual(expect.arrayContaining([2.4, 5]));
    expect(caps.phy).toEqual(expect.arrayContaining(['a', 'b', 'g', 'n', 'ac', 'ax']));
    expect(caps.maxWidthMhz).toBe(160);
    expect(caps.source).toBe('system_profiler');
  });

  it('does not infer 6 GHz without evidence', () => {
    const caps = parseNetshCapabilities('Radio types supported : 802.11n 802.11ac');
    expect(caps.bands).not.toContain(6);
  });
});
