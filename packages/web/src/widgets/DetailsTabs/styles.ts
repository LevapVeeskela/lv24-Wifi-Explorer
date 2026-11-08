import type { SxProps, Theme } from '@mui/material';

export const detailsTabsRootSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  flex: 1,
};

export const detailsTabPanelSx: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
};

export const detailsTabPanelHiddenSx: SxProps<Theme> = {
  display: 'none',
};
