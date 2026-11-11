import type { SxProps, Theme } from '@mui/material';

export const scanAppBarSx: SxProps<Theme> = {
  backgroundColor: 'background.paper',
  borderBottom: 1,
  borderColor: 'divider',
};

export const scanToolbarSx: SxProps<Theme> = {
  minHeight: 40,
  px: 1,
  flexWrap: 'wrap',
  columnGap: 0.75,
  rowGap: 0.5,
};

export const rssiSliderSx: SxProps<Theme> = {
  width: 96,
  mx: 1,
};

export const searchFieldSx: SxProps<Theme> = {
  minWidth: 160,
  flex: 1,
  maxWidth: 360,
};

export const vendorFieldSx: SxProps<Theme> = {
  width: 140,
  minWidth: 140,
  flexShrink: 0,
};

export const rssiFilterSx: SxProps<Theme> = {
  alignItems: 'center',
  minWidth: 150,
};
