import type { SxProps, Theme } from '@mui/material';

export const statusBarSx: SxProps<Theme> = {
  flexShrink: 0,
  minHeight: 28,
  maxHeight: 32,
  px: 1.5,
  py: 0.5,
  borderTop: 1,
  borderColor: 'divider',
  backgroundColor: 'background.paper',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2,
  overflow: 'hidden',
};

export const statusClusterSx: SxProps<Theme> = {
  alignItems: 'center',
  flexWrap: 'nowrap',
  minWidth: 0,
  overflow: 'hidden',
};

export const statusAboutLinkSx: SxProps<Theme> = {
  flexShrink: 0,
  verticalAlign: 'inherit',
  fontSize: 'inherit',
  lineHeight: 'inherit',
};
