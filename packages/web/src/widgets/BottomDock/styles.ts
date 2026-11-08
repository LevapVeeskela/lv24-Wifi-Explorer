import type { SxProps, Theme } from '@mui/material';

export const bottomDockSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  overflow: 'hidden',
  backgroundColor: 'background.paper',
  borderTop: 1,
  borderColor: 'divider',
};

export const tabPanelSx: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
};
