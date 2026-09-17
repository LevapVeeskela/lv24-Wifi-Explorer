import { useEffect, useState, type ComponentType } from 'react';
import { Box, CssBaseline, Paper, ThemeProvider, Typography } from '@mui/material';
import { ScanWorkbenchPage } from '@/pages/ScanWorkbenchPage';
import { theme } from '@/shared/lib/theme';

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

const Workbench: ComponentType<{ demoMode?: boolean }> | undefined = ScanWorkbenchPage;

/**
 * Theme host. ScanWorkbenchPage is used when the workbench slice is present;
 * otherwise the product paper placeholder. Renderer-only (`yarn dev:renderer`)
 * works without `window.wifiExplorer`.
 */
export function App() {
  const [demoMode, setDemoMode] = useState(true);

  useEffect(() => {
    const bridge = window.wifiExplorer;
    if (!bridge) return;

    void bridge.permissionsQuery().then((status) => {
      setDemoMode(status.demoMode);
    });

    const off = bridge.onPermissionsStatus((status) => {
      setDemoMode(status.demoMode);
    });

    void bridge.scanStart();

    return () => {
      off();
      void bridge.scanStop();
    };
  }, []);

  return (
    <ThemeProvider defaultMode="dark" theme={theme}>
      <CssBaseline enableColorScheme />
      {Workbench ? <Workbench demoMode={demoMode} /> : <PlaceholderPaper />}
    </ThemeProvider>
  );
}
