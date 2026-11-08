import type { SxProps, Theme } from '@mui/material';

export const paneResizeSeparatorSx: SxProps<Theme> = {
  flexShrink: 0,
  backgroundColor: 'divider',
  touchAction: 'none',
  '&:hover, &:focus-visible': {
    backgroundColor: 'primary.main',
  },
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: -2,
  },
};

export const paneResizeSeparatorHorizontalSx: SxProps<Theme> = {
  ...paneResizeSeparatorSx,
  height: 6,
  cursor: 'row-resize',
  width: '100%',
};

export const paneResizeSeparatorVerticalSx: SxProps<Theme> = {
  ...paneResizeSeparatorSx,
  width: 6,
  cursor: 'col-resize',
  height: '100%',
};
