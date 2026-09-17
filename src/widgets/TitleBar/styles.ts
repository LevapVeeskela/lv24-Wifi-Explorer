import type { SxProps, Theme } from '@mui/material';

export const titleBarSx: SxProps<Theme> = {
  px: 2,
  py: 0.75,
  borderBottom: 1,
  borderColor: 'divider',
  minHeight: 40,
  alignItems: 'center',
  justifyContent: 'space-between',
};

export const titleClusterSx: SxProps<Theme> = {
  alignItems: 'center',
};

export const titleLabelSx: SxProps<Theme> = {
  fontWeight: 700,
};

export const fileMenuButtonSx: SxProps<Theme> = {
  minWidth: 0,
  px: 1,
  textTransform: 'none',
};

export const fileMenuSubheaderSx: SxProps<Theme> = {
  lineHeight: 2,
  typography: 'caption',
};
