import { Link, Stack, Typography } from '@mui/material';
import type { LocationAuthorization } from '@/domain/identity';
import { statusAboutLinkSx, statusBarSx, statusClusterSx } from './styles';
import { t } from './t';

export type StatusBarProps = {
  networksFound: number;
  selectedCount: number;
  scanCoreState: 'ok' | 'error' | 'demo';
  locationState: LocationAuthorization;
  lastScanLabel: string;
  version: string;
  onAbout: () => void;
};

export function StatusBar({
  networksFound,
  selectedCount,
  scanCoreState,
  locationState,
  lastScanLabel,
  version,
  onAbout,
}: StatusBarProps) {
  const scanCoreText = t('scan.status.scanCore', {
    state: t(`scan.scanCore.${scanCoreState}`),
  });
  const locationText = t('scan.status.location', {
    state: t(`scan.location.${locationState}`),
  });

  return (
    <Stack aria-live="polite" component="footer" direction="row" sx={statusBarSx}>
      <Stack direction="row" spacing={2} sx={statusClusterSx}>
        <Typography color="text.secondary" variant="caption">
          {t('scan.status.timescaleHint')}
        </Typography>
        <Typography color="text.secondary" variant="caption">
          {t('scan.status.shortcutsHint')}
        </Typography>
        <Typography variant="caption">
          {t('scan.status.found', { count: networksFound })}
        </Typography>
        <Typography variant="caption">
          {t('scan.status.selected', { count: selectedCount })}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={2} sx={statusClusterSx}>
        <Typography variant="caption">{scanCoreText}</Typography>
        <Typography variant="caption">{locationText}</Typography>
        <Typography variant="caption">
          {t('scan.status.lastScan', { time: lastScanLabel })}
        </Typography>
        <Typography variant="caption">{t('scan.status.version', { version })}</Typography>
        <Link
          component="button"
          sx={statusAboutLinkSx}
          type="button"
          variant="caption"
          onClick={onAbout}
        >
          {t('scan.status.about')}
        </Link>
      </Stack>
    </Stack>
  );
}
