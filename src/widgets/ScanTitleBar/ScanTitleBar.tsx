import { Chip, Divider, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import Pause from '@mui/icons-material/Pause';
import PlayArrow from '@mui/icons-material/PlayArrow';
import DarkMode from '@mui/icons-material/DarkMode';
import LightMode from '@mui/icons-material/LightMode';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { useColorScheme } from '@mui/material/styles';
import { useScanIntl } from '@/shared/i18n/ScanIntlProvider';
import { markManualThemePreference } from '@/features/scan-settings';
import { scanTitleBarSx } from './styles';

export type ScanTitleBarProps = {
  scanning: boolean;
  demoMode: boolean;
  connectedSsid: string | null;
  linkSummary: string | null;
  onToggleScan: () => void;
  onAbout: () => void;
};

export function ScanTitleBar({
  scanning,
  demoMode,
  connectedSsid,
  linkSummary,
  onToggleScan,
  onAbout,
}: ScanTitleBarProps) {
  const { formatMessage } = useScanIntl();
  const { mode, setMode } = useColorScheme();

  const stateLabel = demoMode
    ? formatMessage('scan.title.demo')
    : scanning
      ? formatMessage('scan.title.scanning')
      : formatMessage('scan.title.paused');

  const toggleTheme = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    markManualThemePreference(next);
  };

  return (
    <Stack direction="row" sx={{ ...scanTitleBarSx, alignItems: 'center', justifyContent: 'space-between' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 700 }} variant="subtitle2">
          {stateLabel}
          {connectedSsid ? ` · ${connectedSsid}` : ''}
        </Typography>
        {demoMode ? <Chip label={formatMessage('scan.title.demo')} size="small" /> : null}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        {linkSummary ? (
          <>
            <Typography color="text.secondary" variant="caption">
              {linkSummary}
            </Typography>
            <Divider flexItem orientation="vertical" />
          </>
        ) : null}
        <Tooltip title={scanning ? formatMessage('scan.title.paused') : formatMessage('scan.title.scanning')}>
          <IconButton aria-label="scan toggle" onClick={onToggleScan} size="small">
            {scanning ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="theme">
          <IconButton aria-label="theme" onClick={toggleTheme} size="small">
            {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={formatMessage('scan.status.about')}>
          <IconButton aria-label={formatMessage('scan.status.about')} onClick={onAbout} size="small">
            <InfoOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );
}
