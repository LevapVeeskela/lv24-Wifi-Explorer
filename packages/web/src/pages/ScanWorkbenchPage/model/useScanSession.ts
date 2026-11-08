import { useCallback, useEffect, useRef, useState } from 'react';
import type { ObservedBss } from '@/domain/bss';
import type { LocationAuthorization } from '@/domain/identity';
import type { ScanViewModel } from '@/domain/scan';
import { DEMO_CONNECTED_BSSID, DEMO_OBSERVED_BSS } from '@/entities/scan';
import { connectedBssidFromPayload, ingestScanPayload } from '@/features/scan-live';
import { loadScanSettings } from '@/features/scan-settings';
import { normalizeLocationAuthorization } from '@/widgets/LocationBanner';
import { locationStateFromSnapshot, scanCoreStateFromSnapshot } from '../scanSnapshotLive';

export type ScanCoreState = 'ok' | 'error' | 'demo';

export type UseScanSessionOptions = {
  demoMode: boolean;
  /** Directed SSID from settings; empty string means a full scan. */
  directedSsid: string;
};

/**
 * Owns the live/demo scan session: bridge subscriptions, permissions,
 * scanning flag and the last snapshot. Pure state orchestration; no UI.
 */
export function useScanSession({ demoMode, directedSsid }: UseScanSessionOptions) {
  const [scanning, setScanning] = useState(
    () => demoMode || loadScanSettings().autoStartScanOnLaunch
  );
  const [bssList, setBssList] = useState<readonly ObservedBss[]>(() =>
    demoMode ? DEMO_OBSERVED_BSS : []
  );
  const [connectedBssid, setConnectedBssid] = useState<string | null>(() =>
    demoMode ? DEMO_CONNECTED_BSSID : null
  );
  const [locationState, setLocationState] = useState<LocationAuthorization>(() =>
    demoMode ? 'granted' : 'not-determined'
  );
  const [scanCoreState, setScanCoreState] = useState<ScanCoreState>(() =>
    demoMode ? 'demo' : 'ok'
  );
  const [lastCapturedAt, setLastCapturedAt] = useState<string | null>(null);
  const [statusTick, setStatusTick] = useState(0);
  const viewRef = useRef<ScanViewModel | null>(null);

  useEffect(() => {
    if (demoMode) {
      setScanCoreState('demo');
      return;
    }
    // Live mode: do not show synthetic rows before the first real snapshot.
    if (viewRef.current == null) setBssList([]);
  }, [demoMode]);

  useEffect(() => {
    const bridge = window.wifiExplorer;
    if (!bridge) return;
    if (demoMode) {
      // Demo fixtures are a product surface, not a scan preference: show them.
      void bridge.scanStart();
      return;
    }
    const initial = loadScanSettings();
    if (initial.autoStartScanOnLaunch) void bridge.scanStart(initial.directedSsid || undefined);
    else void bridge.scanStop();
  }, [demoMode]);

  useEffect(() => {
    const id = window.setInterval(() => setStatusTick((value) => value + 1), 5000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const bridge = window.wifiExplorer;
    if (!bridge) return;

    const offSnap = bridge.onScanSnapshot((payload) => {
      const view = ingestScanPayload(viewRef.current, payload);
      viewRef.current = view;
      setBssList(view.bssRows);
      const liveConnected = connectedBssidFromPayload(payload);
      const snapLocation = locationStateFromSnapshot(payload.location);
      if (snapLocation) setLocationState(snapLocation);
      setScanCoreState(scanCoreStateFromSnapshot(payload, demoMode));
      if (typeof payload.capturedAt === 'string') {
        setLastCapturedAt(payload.capturedAt);
      }
      if (payload.demo === true || payload.source === 'fixtures') {
        setConnectedBssid(DEMO_CONNECTED_BSSID);
      } else if (liveConnected) {
        setConnectedBssid(liveConnected);
      }
    });

    return () => {
      offSnap();
    };
  }, [demoMode]);

  useEffect(() => {
    const bridge = window.wifiExplorer;
    if (!bridge) return;

    void bridge.permissionsQuery().then((status) => {
      setLocationState(normalizeLocationAuthorization(status.location));
      if (status.demoMode) setScanCoreState('demo');
    });

    const off = bridge.onPermissionsStatus((status) => {
      setLocationState(normalizeLocationAuthorization(status.location));
      if (status.demoMode) setScanCoreState('demo');
    });
    return () => off();
  }, []);

  const toggleScan = useCallback(() => {
    setScanning((value) => {
      const next = !value;
      const bridge = window.wifiExplorer;
      if (bridge) {
        if (next) void bridge.scanStart(directedSsid || undefined);
        else void bridge.scanStop();
      }
      return next;
    });
  }, [directedSsid]);

  const startScan = useCallback(() => {
    setScanning((value) => {
      if (value) return value;
      const bridge = window.wifiExplorer;
      if (bridge) void bridge.scanStart(directedSsid || undefined);
      return true;
    });
  }, [directedSsid]);

  const stopScan = useCallback(() => {
    setScanning((value) => {
      if (!value) return value;
      const bridge = window.wifiExplorer;
      if (bridge) void bridge.scanStop();
      return false;
    });
  }, []);

  return {
    bssList,
    setBssList,
    connectedBssid,
    setConnectedBssid,
    locationState,
    setLocationState,
    scanCoreState,
    setScanCoreState,
    lastCapturedAt,
    setLastCapturedAt,
    statusTick,
    scanning,
    setScanning,
    toggleScan,
    startScan,
    stopScan,
    viewRef,
  };
}
