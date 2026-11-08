const BSSID_KEY = /^bssid$/i;

function redactValue(key: string, value: unknown): unknown {
  if (BSSID_KEY.test(key) && typeof value === 'string') {
    return '[redacted-bssid]';
  }
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map((item) => redactUnknown(item));
    }
    return redactUnknown(value as Record<string, unknown>);
  }
  return value;
}

function redactUnknown(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((item) => redactUnknown(item));
  }
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    out[key] = redactValue(key, child);
  }
  return out;
}

/** Safe console logging for scan payloads — never emit raw BSSID. */
export function redactForProductionLog(value: unknown): unknown {
  return redactUnknown(value);
}

export function logScanDebug(scope: string, detail: unknown): void {
  if (process.env.WIFI_EXPLORER_SCAN_DEBUG !== '1') return;
  console.info(`[scan:${scope}]`, redactForProductionLog(detail));
}
