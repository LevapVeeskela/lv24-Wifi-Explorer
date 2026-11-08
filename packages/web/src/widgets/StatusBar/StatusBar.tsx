import { Link, Stack, Typography } from '@mui/material';
import type { LocationAuthorization } from '@/domain/identity';
import type { SignalQuality } from '@/domain/signal';
import { qualityMessageKey } from '@/entities/bss';
import { useScanIntl, type MessageKey } from '@/shared/i18n';
import { statusAboutLinkSx, statusBarSx, statusClusterSx } from './styles';

const SCAN_CORE_KEY: Record<'ok' | 'error' | 'demo', MessageKey> = {
  ok: 'scan.scanCore.ok',
  error: 'scan.scanCore.error',
  demo: 'scan.scanCore.demo',
};

const LOCATION_KEY: Record<LocationAuthorization, MessageKey> = {
  granted: 'scan.location.granted',
  denied: 'scan.location.denied',
  'not-determined': 'scan.location.notDetermined',
  restricted: 'scan.location.restricted',
};

export type StatusBarProps = {
  networksFound: number;
  selectedCount: number;
  scanCoreState: 'ok' | 'error' | 'demo';
  locationState: LocationAuthorization;
  lastScanLabel: string;
  version: string;
  onAbout: () => void;
  /** Rows remaining after filters (optional). */
  displayedCount?: number;
  /** Number of annotation rules (optional). */
  annotationCount?: number;
  /** Quality of the selected row, if any (optional). */
  signalQuality?: SignalQuality | null;
};

export function StatusBar({
  networksFound,
  selectedCount,
  scanCoreState,
  locationState,
  lastScanLabel,
  version,
  onAbout,
  displayedCount,
  annotationCount,
  signalQuality,
}: StatusBarProps) {
  const { formatMessage } = useScanIntl();
  const scanCoreText = formatMessage('scan.status.scanCore', {
    state: formatMessage(SCAN_CORE_KEY[scanCoreState]),
  });
  const locationText = formatMessage('scan.status.location', {
    state: formatMessage(LOCATION_KEY[locationState]),
  });

  return (
    <Stack aria-live="polite" component="footer" direction="row" sx={statusBarSx}>
      <Stack direction="row" spacing={2} sx={statusClusterSx}>
        <Typography color="text.secondary" variant="caption">
          {formatMessage('scan.status.timescaleHint')}
        </Typography>
        <Typography color="text.secondary" variant="caption">
          {formatMessage('scan.status.shortcutsHint')}
        </Typography>
        <Typography variant="caption">
          {formatMessage('scan.status.found', { count: networksFound })}
        </Typography>
        {displayedCount != null ? (
          <Typography variant="caption">
            {formatMessage('scan.status.displayed', { count: displayedCount })}
          </Typography>
        ) : null}
        <Typography variant="caption">
          {formatMessage('scan.status.selected', { count: selectedCount })}
        </Typography>
        {annotationCount != null ? (
          <Typography variant="caption">
            {formatMessage('scan.status.annotations', { count: annotationCount })}
          </Typography>
        ) : null}
        {signalQuality ? (
          <Typography variant="caption">
            {formatMessage('scan.status.quality', {
              quality: formatMessage(qualityMessageKey(signalQuality)),
            })}
          </Typography>
        ) : null}
      </Stack>
      <Stack direction="row" spacing={2} sx={statusClusterSx}>
        <Typography variant="caption">{scanCoreText}</Typography>
        <Typography variant="caption">{locationText}</Typography>
        <Typography variant="caption">
          {formatMessage('scan.status.lastScan', { time: lastScanLabel })}
        </Typography>
        <Typography variant="caption">
          {formatMessage('scan.status.version', { version })}
        </Typography>
        <Link
          component="button"
          sx={statusAboutLinkSx}
          type="button"
          variant="caption"
          onClick={onAbout}
        >
          {formatMessage('scan.status.about')}
        </Link>
      </Stack>
    </Stack>
  );
}
