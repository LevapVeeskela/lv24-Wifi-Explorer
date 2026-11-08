/** Push scan interval to the native bridge when available. */
export function applyScanIntervalMs(intervalSec: number): void {
  const ms = Math.max(3000, Math.round(intervalSec * 1000));
  const bridge = window.wifiExplorer;
  if (bridge?.scanSetIntervalMs) {
    void bridge.scanSetIntervalMs(ms);
  }
}
