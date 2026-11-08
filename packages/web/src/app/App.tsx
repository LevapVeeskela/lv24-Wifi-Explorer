import { useEffect, useState, type ComponentType } from 'react';
import { Alert, Box, CssBaseline, Paper, ThemeProvider, Typography } from '@mui/material';
import { ScanWorkbenchPage } from '@/pages/ScanWorkbenchPage';
import { theme } from '@/shared/lib/theme';
import { readLocalePreference, subscribeLocalePreference, type AppLocale } from '@/shared/i18n';

function PlaceholderPaper() {
  return (
    <Box sx={{ minHeight: '100vh', p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography component="h1" variant="h4">
          LV24 WiFi Explorer
        </Typography>
      </Paper>
    </Box>
  );
}

const Workbench: ComponentType<{ demoMode?: boolean; locale?: AppLocale }> | undefined =
  ScanWorkbenchPage;

/**
 * Theme host. ScanWorkbenchPage is used when the workbench slice is present;
 * otherwise the product paper placeholder. Renderer-only (`yarn dev:renderer`)
 * works without `window.wifiExplorer`.
 */
export function App() {
  // Renderer-only dev has no bridge; real Electron starts in live mode until
  // the first permissions/snapshot event says otherwise.
  const [demoMode, setDemoMode] = useState(() => !window.wifiExplorer);
  const [helperNotice, setHelperNotice] = useState<string | null>(null);
  const [locale, setLocale] = useState<AppLocale>(() => readLocalePreference());

  useEffect(() => subscribeLocalePreference(setLocale), []);

  useEffect(() => {
    const bridge = window.wifiExplorer;
    if (!bridge) return;

    void bridge.permissionsQuery().then((status) => {
      setDemoMode(status.demoMode);
      return undefined;
    });

    const off = bridge.onPermissionsStatus((status) => {
      setDemoMode(status.demoMode);
    });

    const offHelper = bridge.onHelperStatus?.((payload) => {
      if (payload.state === 'fallback') {
        setHelperNotice('Live scan unavailable — showing demo data.');
      } else if (payload.state === 'error') {
        setHelperNotice('Scan helper error — check Location/Settings.');
      } else if (payload.state === 'running') {
        setHelperNotice(null);
      }
    });

    return () => {
      off();
      offHelper?.();
      void bridge.scanStop();
    };
  }, []);

  return (
    <ThemeProvider defaultMode="dark" theme={theme}>
      <CssBaseline enableColorScheme />
      {helperNotice ? (
        <Alert
          onClose={() => setHelperNotice(null)}
          severity="warning"
          sx={{ left: 12, position: 'fixed', right: 12, top: 8, zIndex: 2000 }}
        >
          {helperNotice}
        </Alert>
      ) : null}
      {Workbench ? <Workbench demoMode={demoMode} locale={locale} /> : <PlaceholderPaper />}
    </ThemeProvider>
  );
}
