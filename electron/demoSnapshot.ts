/** Synthetic scan payload for unsigned dev / missing Location permission. */
export function buildDemoScanSnapshot(): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    capturedAt: now,
    interfaceName: 'en0',
    location: 'notDetermined',
    includeHiddenRequested: false,
    associated: null,
    networks: [
      {
        bssid: '02:00:00:00:00:01',
        ssid: 'LV24-Demo-2G',
        rssiDbm: -52,
        noiseDbm: -92,
        channel: { band: '2.4', number: 6, widthMhz: 20 },
        security: { kind: 'wpa2-psk' },
        demo: true,
      },
      {
        bssid: '02:00:00:00:00:02',
        ssid: 'LV24-Demo-5G',
        rssiDbm: -61,
        noiseDbm: -95,
        channel: { band: '5', number: 36, widthMhz: 80 },
        security: { kind: 'wpa3-sae' },
        demo: true,
      },
    ],
    demo: true,
  };
}
