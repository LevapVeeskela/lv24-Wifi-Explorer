import type { SxProps, Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';

export const scanDataGridRootSx: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  width: '100%',
  borderRadius: 0,
  border: 'none',
  '& .MuiDataGrid-root': {
    borderRadius: 0,
    border: 'none',
    height: '100%',
  },
  '& .MuiDataGrid-columnHeaders': {
    minHeight: 36,
    maxHeight: 36,
  },
  '& .MuiDataGrid-row': {
    maxHeight: 32,
    minHeight: 28,
  },
  '& .scan-grid-row--connected': {
    boxShadow: (theme) => `inset 3px 0 0 ${theme.palette.success.main}`,
  },
  '& .scan-grid-row--stale': {
    opacity: 0.45,
  },
  '& .scan-grid-row--stale.Mui-selected, & .scan-grid-row--stale.scan-grid-row--selected': {
    opacity: 0.45,
  },
  '& .scan-grid-ssid--connected .MuiTypography-root': {
    fontWeight: 600,
  },
  '& .MuiDataGrid-row.Mui-selected .scan-grid-ssid--connected .MuiTypography-root': {
    fontWeight: 600,
  },
  '& .scan-grid-row--selected, & .MuiDataGrid-row.Mui-selected': {
    backgroundColor: (theme) => theme.palette.action.selected,
  },
  '& .scan-grid-row--selected': {
    boxShadow: (theme) => `inset 3px 0 0 ${theme.palette.primary.main}`,
  },
  '& .MuiDataGrid-row.Mui-selected:hover': {
    backgroundColor: (theme) => theme.palette.action.selected,
  },
  '& .MuiDataGrid-cell.scan-grid-cell--quality-excellent': {
    backgroundColor: (theme) => alpha(theme.palette.success.main, 0.14),
  },
  '& .MuiDataGrid-cell.scan-grid-cell--quality-good': {
    backgroundColor: (theme) => alpha(theme.palette.success.main, 0.1),
  },
  '& .MuiDataGrid-cell.scan-grid-cell--quality-fair': {
    backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.12),
  },
  '& .MuiDataGrid-cell.scan-grid-cell--quality-poor': {
    backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.18),
  },
  '& .MuiDataGrid-cell.scan-grid-cell--quality-unusable': {
    backgroundColor: (theme) => alpha(theme.palette.error.main, 0.16),
  },
  '& .MuiDataGrid-cell.scan-grid-cell--security-open': {
    backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.22),
  },
  '& .MuiDataGrid-cell.scan-grid-cell--security-weak': {
    backgroundColor: (theme) => alpha(theme.palette.error.main, 0.14),
  },
  '& .MuiDataGrid-row.Mui-selected .MuiDataGrid-cell[class*="scan-grid-cell--"]': {
    backgroundColor: (theme) => theme.palette.action.selected,
    boxShadow: (theme) => `inset 0 0 0 9999px ${alpha(theme.palette.primary.main, 0.08)}`,
  },
};

export const scanDataGridProSx: SxProps<Theme> = {
  height: '100%',
  borderRadius: 0,
  border: 'none',
};

export const overlayRootSx: SxProps<Theme> = {
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  height: '100%',
  justifyContent: 'center',
  px: 2,
  textAlign: 'center',
};

export const seriesSwatchSx = (color: string): SxProps<Theme> => ({
  width: 8,
  height: 8,
  borderRadius: 0,
  backgroundColor: color,
  flexShrink: 0,
});

export const signalBarTrackSx: SxProps<Theme> = {
  flex: 1,
  minWidth: 48,
  height: 6,
  borderRadius: 0,
  '& .MuiLinearProgress-bar': {
    transition: 'none',
  },
};

export const signalCellSx: SxProps<Theme> = {
  alignItems: 'center',
  width: '100%',
};

export const signalPctSx: SxProps<Theme> = {
  minWidth: 36,
  fontVariantNumeric: 'tabular-nums',
};

export const ssidCellSx: SxProps<Theme> = {
  alignItems: 'center',
  minWidth: 0,
};

export const ssidTextSx = (opts: { connected: boolean; hidden: boolean }): SxProps<Theme> => ({
  fontWeight: opts.connected ? 600 : 400,
  fontStyle: opts.hidden ? 'italic' : 'normal',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const vendorCellSx: SxProps<Theme> = {
  alignItems: 'center',
  minWidth: 0,
};

export const vendorAvatarSx: SxProps<Theme> = {
  width: 16,
  height: 16,
  fontSize: '0.55rem',
};

export const monoCellSx: SxProps<Theme> = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '0.75rem',
};

export const issueFlagsCellSx: SxProps<Theme> = {
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
};

export const issueCountChipSx: SxProps<Theme> = {
  height: 20,
  minWidth: 24,
  fontVariantNumeric: 'tabular-nums',
  '& .MuiChip-label': {
    px: 0.75,
  },
};
