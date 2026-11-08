import { Box, Button, Stack, Typography } from '@mui/material';
import { useScanIntl, type MessageKey } from '@/shared/i18n';
import { overlayRootSx } from './styles';

export type ScanGridOverlayKind = 'empty' | 'demo' | 'location-denied' | 'empty-filter';

export type ScanGridOverlayProps = {
  kind: ScanGridOverlayKind;
};

const KIND_KEY: Record<ScanGridOverlayKind, MessageKey> = {
  empty: 'scan.grid.empty',
  demo: 'scan.grid.demo',
  'location-denied': 'scan.grid.locationDenied',
  'empty-filter': 'scan.grid.emptyFilter',
};

export function ScanGridOverlay({ kind }: ScanGridOverlayProps) {
  const { formatMessage } = useScanIntl();

  const openSettings = () => {
    void window.wifiExplorer?.permissionsOpenSettings?.();
  };

  const canOpenSettings = typeof window.wifiExplorer?.permissionsOpenSettings === 'function';

  if (kind === 'location-denied') {
    return (
      <Box sx={overlayRootSx}>
        <Stack spacing={1} sx={{ maxWidth: 420, textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 600 }} variant="body2">
            {formatMessage('permissions.denied.title')}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {formatMessage('permissions.denied.body')}
          </Typography>
          {canOpenSettings ? (
            <Button size="small" variant="outlined" onClick={openSettings}>
              {formatMessage('permissions.openSettings')}
            </Button>
          ) : null}
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={overlayRootSx}>
      <Typography color="text.secondary" variant="body2">
        {formatMessage(KIND_KEY[kind])}
      </Typography>
    </Box>
  );
}

export function resolveScanGridOverlay(args: {
  visibleCount: number;
  totalCount: number;
  locationDenied: boolean;
  demo: boolean;
  filtersActive: boolean;
}): ScanGridOverlayKind | null {
  if (args.visibleCount > 0) return null;
  if (args.locationDenied && !args.demo) return 'location-denied';
  if (args.demo && args.totalCount === 0) return 'demo';
  if (args.filtersActive && args.totalCount > 0) return 'empty-filter';
  if (args.demo) return 'demo';
  return 'empty';
}
