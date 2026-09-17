import type { SxProps, Theme } from '@mui/material';

export const statusBarSx: SxProps<Theme> = {
  minHeight: 28,
  px: 1.5,
  py: 0.5,
  borderTop: 1,
  borderColor: 'divider',
  backgroundColor: 'background.paper',
  alignItems: 'center',
  justifyContent: 'space-between',
};

export const statusClusterSx: SxProps<Theme> = {
  alignItems: 'center',
};
