import { useEffect } from 'react';
import {
  Alert,
  Button,
  Divider,
  FormControlLabel,
  LinearProgress,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { useScanIntl, type MessageKey } from '@/shared/i18n';
import { useUpdateStatus, type UpdateState } from '@/features/updates';
import type { ScanSettings } from './types';

const STATE_LABEL: Record<UpdateState, MessageKey> = {
  unsupported: 'scan.settings.updates.state.unsupported',
  idle: 'scan.settings.updates.state.idle',
  checking: 'scan.settings.updates.state.checking',
  available: 'scan.settings.updates.state.available',
  downloading: 'scan.settings.updates.state.downloading',
  downloaded: 'scan.settings.updates.state.downloaded',
  'up-to-date': 'scan.settings.updates.state.upToDate',
  error: 'scan.settings.updates.state.error',
};

export type ScanSettingsUpdatesPanelProps = {
  settings: ScanSettings;
  onChange: (next: ScanSettings) => void;
};

export function ScanSettingsUpdatesPanel({ settings, onChange }: ScanSettingsUpdatesPanelProps) {
  const { formatMessage } = useScanIntl();
  const { status, loading, setEnabled, check, install } = useUpdateStatus();

  useEffect(() => {
    if (!loading && status.platformSupported) {
      void setEnabled(settings.autoUpdateEnabled);
    }
  }, [loading, status.platformSupported, settings.autoUpdateEnabled, setEnabled]);

  const busy = status.state === 'checking' || status.state === 'downloading';

  return (
    <Stack spacing={2}>
      <FormControlLabel
        control={
          <Switch
            checked={settings.autoUpdateEnabled}
            onChange={(_, checked) => {
              onChange({ ...settings, autoUpdateEnabled: checked });
              void setEnabled(checked);
            }}
          />
        }
        label={formatMessage('scan.settings.updates.auto')}
      />
      <Typography color="text.secondary" variant="body2">
        {formatMessage('scan.settings.updates.note')}
      </Typography>

      <Divider />

      <Stack spacing={0.5}>
        <Typography variant="body2">
          {formatMessage('scan.settings.updates.current', {
            version: status.currentVersion || '—',
          })}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {formatMessage(STATE_LABEL[status.state])}
        </Typography>
        {status.availableVersion ? (
          <Typography variant="body2">
            {formatMessage('scan.settings.updates.available', {
              version: status.availableVersion,
            })}
          </Typography>
        ) : null}
      </Stack>

      {status.state === 'downloading' && status.progressPercent != null ? (
        <LinearProgress value={status.progressPercent} variant="determinate" />
      ) : null}

      {!status.platformSupported ? (
        <Alert severity="info">{formatMessage('scan.settings.updates.unsupported')}</Alert>
      ) : null}
      {status.state === 'error' && status.message ? (
        <Alert severity="warning">{status.message}</Alert>
      ) : null}

      <Stack direction="row" spacing={1}>
        <Button
          disabled={busy || !status.platformSupported}
          onClick={() => void check()}
          size="small"
        >
          {formatMessage('scan.settings.updates.check')}
        </Button>
        {status.state === 'downloaded' ? (
          <Button onClick={() => void install()} size="small" variant="contained">
            {formatMessage('scan.settings.updates.install')}
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
}
