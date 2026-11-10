import type { SxProps, Theme } from '@mui/material';

export const statusBarSx: SxProps<Theme> = {
  flexShrink: 0,
  minHeight: 28,
  px: 1.5,
  py: 0.5,
  borderTop: 1,
  borderColor: 'divider',
  backgroundColor: 'background.paper',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 1,
};

export const statusClusterSx: SxProps<Theme> = {
  alignItems: 'center',
  flexWrap: 'wrap',
  rowGap: 0.25,
  minWidth: 0,
  overflow: 'visible',
  '& > *': {
    whiteSpace: 'nowrap',
  },
};

export const statusAboutLinkSx: SxProps<Theme> = {
  flexShrink: 0,
  verticalAlign: 'inherit',
  fontSize: 'inherit',
  lineHeight: 'inherit',
};
