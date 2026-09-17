import { Box, Button, Typography } from '@mui/material';
import { overlayRootSx } from './styles';
import { t } from './t';

export type ScanGridOverlayKind = 'empty' | 'demo' | 'location-denied' | 'empty-filter';

export type ScanGridOverlayProps = {
  kind: ScanGridOverlayKind;
};

const KIND_KEY: Record<ScanGridOverlayKind, string> = {
  empty: 'scan.grid.empty',
  demo: 'scan.grid.demo',
  'location-denied': 'scan.grid.locationDenied',
  'empty-filter': 'scan.grid.emptyFilter',
};

export function ScanGridOverlay({ kind }: ScanGridOverlayProps) {
  const openSettings = () => {
    void window.wifiExplorer?.permissionsOpenSettings();
  };

  return (
    <Box sx={overlayRootSx}>
      <Typography color="text.secondary" variant="body2">
        {t(KIND_KEY[kind])}
      </Typography>
      {kind === 'location-denied' ? (
        <Button size="small" variant="outlined" onClick={openSettings}>
          {t('scan.grid.openLocationSettings')}
        </Button>
      ) : null}
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
