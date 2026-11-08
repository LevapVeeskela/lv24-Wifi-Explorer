/**
 * Display % for RSSI — linear map (SPEC §7.4).
 * −100 dBm → 0%; −50 dBm → 100%; outside that range clamps.
 */
export function signalPercentFromRssi(rssiDbm: number): number {
  const rssiClamped = Math.min(-50, Math.max(-100, rssiDbm));
  return Math.round(((rssiClamped + 100) / 50) * 100);
}
