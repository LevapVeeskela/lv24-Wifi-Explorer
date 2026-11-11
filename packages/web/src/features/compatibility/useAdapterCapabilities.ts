import { useEffect, useState } from 'react';
import type { AdapterCapabilities, BandGhz, PhyLetter, SecurityKind } from '@/domain';

const BANDS = new Set<BandGhz>([2.4, 5, 6]);
const PHYS = new Set<PhyLetter>(['a', 'b', 'g', 'n', 'ac', 'ax', 'be']);
const SECURITY = new Set<SecurityKind>([
  'open',
  'wep',
  'wpa-personal',
  'wpa-personal-mixed',
  'wpa2-personal',
  'wpa3-personal',
  'wpa3-transition',
  'wpa-enterprise',
  'wpa-enterprise-mixed',
  'wpa2-enterprise',
  'wpa3-enterprise',
  'owe',
  'owe-transition',
  'unknown',
]);

export type AdapterCapabilitiesState = {
  status: 'loading' | 'ready' | 'error';
  capabilities: AdapterCapabilities | null;
  errorCode?: string;
};

function strings<T>(value: unknown, allowed: ReadonlySet<T>): T[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is T => allowed.has(item as T));
}

export function normalizeAdapterCapabilities(value: unknown): AdapterCapabilities | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const maxWidth =
    typeof raw.maxWidthMhz === 'number' && [20, 40, 80, 160, 320].includes(raw.maxWidthMhz)
      ? raw.maxWidthMhz
      : null;
  const source =
    raw.source === 'netsh' ||
    raw.source === 'iw' ||
    raw.source === 'system_profiler' ||
    raw.source === 'demo'
      ? raw.source
      : 'unknown';
  return {
    bands: strings(raw.bands, BANDS),
    phy: strings(raw.phy, PHYS),
    maxWidthMhz: maxWidth,
    security: strings(raw.security, SECURITY),
    streams: typeof raw.streams === 'number' ? raw.streams : null,
    interfaceName: typeof raw.interfaceName === 'string' ? raw.interfaceName : null,
    source,
    estimated: raw.estimated === true,
  };
}

export function useAdapterCapabilities(): AdapterCapabilitiesState {
  const [state, setState] = useState<AdapterCapabilitiesState>({
    status: 'loading',
    capabilities: null,
  });

  useEffect(() => {
    let cancelled = false;
    const bridge = typeof window !== 'undefined' ? window.wifiExplorer : undefined;
    if (!bridge?.adapterCapabilities) {
      setState({ status: 'error', capabilities: null, errorCode: 'UNSUPPORTED' });
      return () => {
        cancelled = true;
      };
    }
    void bridge
      .adapterCapabilities()
      .then((result) => {
        if (cancelled) return;
        if (result.ok === false) {
          setState({
            status: 'error',
            capabilities: null,
            errorCode: typeof result.code === 'string' ? result.code : 'ERROR',
          });
          return;
        }
        const capabilities = normalizeAdapterCapabilities(result.capabilities);
        setState(
          capabilities
            ? { status: 'ready', capabilities }
            : { status: 'error', capabilities: null, errorCode: 'PARSE_FAILED' }
        );
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', capabilities: null, errorCode: 'ERROR' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
