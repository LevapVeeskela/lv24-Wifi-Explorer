import { useCallback, useEffect, useState } from 'react';

export type UpdateState =
  | 'unsupported'
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'up-to-date'
  | 'error';

export type UpdateStatus = {
  state: UpdateState;
  currentVersion: string;
  enabled: boolean;
  availableVersion: string | null;
  progressPercent: number | null;
  message: string | null;
  platformSupported: boolean;
  packaged: boolean;
};

const IDLE: UpdateStatus = {
  state: 'unsupported',
  currentVersion: '',
  enabled: false,
  availableVersion: null,
  progressPercent: null,
  message: null,
  platformSupported: false,
  packaged: false,
};

const STATES = new Set<UpdateState>([
  'unsupported',
  'idle',
  'checking',
  'available',
  'downloading',
  'downloaded',
  'up-to-date',
  'error',
]);

function normalize(raw: unknown): UpdateStatus | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  const state =
    typeof value.state === 'string' && STATES.has(value.state as UpdateState)
      ? (value.state as UpdateState)
      : null;
  if (!state) return null;
  return {
    state,
    currentVersion: typeof value.currentVersion === 'string' ? value.currentVersion : '',
    enabled: value.enabled === true,
    availableVersion: typeof value.availableVersion === 'string' ? value.availableVersion : null,
    progressPercent: typeof value.progressPercent === 'number' ? value.progressPercent : null,
    message: typeof value.message === 'string' ? value.message : null,
    platformSupported: value.platformSupported === true,
    packaged: value.packaged === true,
  };
}

export function useUpdateStatus(): {
  status: UpdateStatus;
  loading: boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
  check: () => Promise<void>;
  install: () => Promise<void>;
} {
  const [status, setStatus] = useState<UpdateStatus>(IDLE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const bridge = typeof window !== 'undefined' ? window.wifiExplorer : undefined;
    if (!bridge?.updatesGetStatus) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }
    void bridge
      .updatesGetStatus()
      .then((result) => {
        if (cancelled) return;
        const next = normalize(result.status);
        if (next) setStatus(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    const unsubscribe = bridge.onUpdateStatus?.((raw) => {
      const next = normalize(raw);
      if (next) setStatus(next);
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const setEnabled = useCallback(async (enabled: boolean) => {
    const bridge = typeof window !== 'undefined' ? window.wifiExplorer : undefined;
    const result = await bridge?.updatesSetEnabled?.(enabled);
    const next = normalize(result?.status);
    if (next) setStatus(next);
  }, []);

  const check = useCallback(async () => {
    const bridge = typeof window !== 'undefined' ? window.wifiExplorer : undefined;
    const result = await bridge?.updatesCheck?.();
    const next = normalize(result?.status);
    if (next) setStatus(next);
  }, []);

  const install = useCallback(async () => {
    const bridge = typeof window !== 'undefined' ? window.wifiExplorer : undefined;
    await bridge?.updatesInstall?.();
  }, []);

  return { status, loading, setEnabled, check, install };
}
