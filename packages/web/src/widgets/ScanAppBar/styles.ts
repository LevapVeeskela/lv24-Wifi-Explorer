import type { SxProps, Theme } from '@mui/material';

export const scanAppBarSx: SxProps<Theme> = {
  backgroundColor: 'background.paper',
  borderBottom: 1,
  borderColor: 'divider',
};

export const scanToolbarSx: SxProps<Theme> = {
  minHeight: 40,
  px: 1,
  gap: 1,
};

export const rssiSliderSx: SxProps<Theme> = {
  width: 120,
  mx: 1,
};

export const searchFieldSx: SxProps<Theme> = {
  minWidth: 200,
  flex: 1,
  maxWidth: 360,
};

export const vendorFieldSx: SxProps<Theme> = {
  width: 140,
};

export const rssiFilterSx: SxProps<Theme> = {
  alignItems: 'center',
  minWidth: 180,
};
