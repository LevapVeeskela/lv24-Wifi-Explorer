import type { SxProps, Theme } from '@mui/material';

export const scanShellSx: SxProps<Theme> = {
  height: '100dvh',
  minWidth: 960,
  minHeight: 640,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: 'background.default',
};

export const scanWorkbenchBodySx: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'row',
  overflow: 'hidden',
};

export const scanMainSplitSx: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
};

export const scanGridRegionSx = (topFraction: number): SxProps<Theme> => ({
  flex: `${topFraction} 1 0`,
  minHeight: 160,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

export const scanDockRegionSx = (bottomFraction: number): SxProps<Theme> => ({
  flex: `${bottomFraction} 1 0`,
  minHeight: 180,
  minWidth: 0,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
});

export const skipLinkSx: SxProps<Theme> = {
  position: 'absolute',
  left: 8,
  top: 8,
  zIndex: 20,
  px: 1,
  py: 0.5,
  clipPath: 'inset(100%)',
  '&:focus': {
    clipPath: 'none',
    backgroundColor: 'background.paper',
  },
};
