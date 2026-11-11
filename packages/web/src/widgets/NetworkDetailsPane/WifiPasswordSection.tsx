import { useEffect, useState } from 'react';
import { Alert, Button, LinearProgress, Stack, TextField, Typography } from '@mui/material';
import { useScanIntl, type MessageKey } from '@/shared/i18n';
import { useSavedWifiProfiles, useWifiPassword } from '@/features/wifi-password';

const ERROR_KEY: Record<string, MessageKey> = {
  NOT_SAVED: 'scan.password.notSaved',
  NO_PASSWORD: 'scan.password.noPassword',
  DENIED: 'scan.password.denied',
  UNSUPPORTED: 'scan.password.unsupported',
  ERROR: 'scan.password.error',
};

export type WifiPasswordSectionProps = {
  ssid: string | null;
  hidden: boolean;
  openNetwork: boolean;
};

/**
 * Explicit, per-network password reveal. Never renders automatically, never
 * writes the value to storage/logs, and clears it after 30 seconds.
 */
export function WifiPasswordSection({ ssid, hidden, openNetwork }: WifiPasswordSectionProps) {
  const { formatMessage } = useScanIntl();
  const { profiles, listable } = useSavedWifiProfiles();
  const { state, reveal, hide } = useWifiPassword(ssid);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [state.password]);

  const bridgeAvailable =
    typeof window !== 'undefined' && Boolean(window.wifiExplorer?.wifiPassword);
  if (!bridgeAvailable || !ssid || hidden || openNetwork) return null;

  const saved = !listable || profiles.has(ssid);
  if (!saved) return null;

  const copy = () => {
    if (!state.password) return;
    void navigator.clipboard?.writeText(state.password).then(() => setCopied(true));
  };

  const errorKey = state.code ? ERROR_KEY[state.code] : undefined;

  return (
    <Stack spacing={1} sx={{ mt: 2 }}>
      <Typography variant="subtitle2">{formatMessage('scan.password.title')}</Typography>
      <Typography color="text.secondary" variant="caption">
        {formatMessage('scan.password.warning')}
      </Typography>
      {state.status === 'idle' ? (
        <Button onClick={reveal} size="small" variant="outlined">
          {formatMessage('scan.password.show')}
        </Button>
      ) : null}
      {state.status === 'loading' ? <LinearProgress /> : null}
      {state.status === 'shown' && state.password ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <TextField
            fullWidth
            size="small"
            slotProps={{ htmlInput: { style: { fontFamily: 'monospace' } } }}
            value={state.password}
          />
          <Button onClick={copy} size="small">
            {formatMessage(copied ? 'scan.password.copied' : 'scan.password.copy')}
          </Button>
          <Button onClick={hide} size="small" variant="text">
            {formatMessage('scan.password.hide')}
          </Button>
        </Stack>
      ) : null}
      {state.status === 'error' ? (
        <Alert severity="warning">{formatMessage(errorKey ?? 'scan.password.error')}</Alert>
      ) : null}
    </Stack>
  );
}
