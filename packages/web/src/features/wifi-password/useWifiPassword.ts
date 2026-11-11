import { useCallback, useEffect, useState } from 'react';

export type WifiPasswordState = {
  status: 'idle' | 'loading' | 'shown' | 'error';
  password: string | null;
  code: string | null;
};

export function useSavedWifiProfiles(): {
  profiles: ReadonlySet<string>;
  listable: boolean;
  reload: () => void;
} {
  const [profiles, setProfiles] = useState<ReadonlySet<string>>(() => new Set());
  const [listable, setListable] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const bridge = typeof window !== 'undefined' ? window.wifiExplorer : undefined;
    if (!bridge?.savedWifiProfiles) {
      setListable(false);
      return () => {
        cancelled = true;
      };
    }
    void bridge
      .savedWifiProfiles()
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setProfiles(new Set(result.profiles ?? []));
          setListable(result.listable !== false);
        } else {
          setProfiles(new Set());
          setListable(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfiles(new Set());
          setListable(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);
  return { profiles, listable, reload };
}

export function useWifiPassword(ssid: string | null): {
  state: WifiPasswordState;
  reveal: () => void;
  hide: () => void;
} {
  const [state, setState] = useState<WifiPasswordState>({
    status: 'idle',
    password: null,
    code: null,
  });

  const hide = useCallback(() => {
    setState({ status: 'idle', password: null, code: null });
  }, []);

  useEffect(() => {
    hide();
  }, [ssid, hide]);

  useEffect(() => {
    if (state.status !== 'shown' || !state.password) return;
    const timer = window.setTimeout(hide, 30_000);
    return () => window.clearTimeout(timer);
  }, [state.status, state.password, hide]);

  const reveal = useCallback(() => {
    if (!ssid) return;
    const bridge = typeof window !== 'undefined' ? window.wifiExplorer : undefined;
    if (!bridge?.wifiPassword) {
      setState({ status: 'error', password: null, code: 'UNSUPPORTED' });
      return;
    }
    setState({ status: 'loading', password: null, code: null });
    void bridge
      .wifiPassword(ssid)
      .then((result) => {
        if (result.ok && result.password) {
          setState({ status: 'shown', password: result.password, code: null });
        } else {
          setState({ status: 'error', password: null, code: result.code ?? 'ERROR' });
        }
      })
      .catch(() => setState({ status: 'error', password: null, code: 'ERROR' }));
  }, [ssid]);

  return { state, reveal, hide };
}
