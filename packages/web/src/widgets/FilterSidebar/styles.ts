import type { SxProps, Theme } from '@mui/material';

export const FILTER_SIDEBAR_WIDTH = 220;
export const FILTER_SIDEBAR_COLLAPSED_WIDTH = 44;

export const filterSidebarRootSx = (collapsed: boolean): SxProps<Theme> => ({
  flex: `0 0 ${collapsed ? FILTER_SIDEBAR_COLLAPSED_WIDTH : FILTER_SIDEBAR_WIDTH}px`,
  width: collapsed ? FILTER_SIDEBAR_COLLAPSED_WIDTH : FILTER_SIDEBAR_WIDTH,
  minWidth: collapsed ? FILTER_SIDEBAR_COLLAPSED_WIDTH : FILTER_SIDEBAR_WIDTH,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  overflow: 'hidden',
  backgroundColor: 'background.paper',
  borderRight: 1,
  borderColor: 'divider',
});

export const filterSidebarHeaderSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 0.5,
  px: 1,
  py: 0.75,
  minHeight: 40,
  borderBottom: 1,
  borderColor: 'divider',
};

export const filterSidebarScrollSx: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  px: 1,
  py: 1,
};

export const filterSectionSx: SxProps<Theme> = {
  mb: 1.5,
};

export const filterSectionTitleSx: SxProps<Theme> = {
  display: 'block',
  mb: 0.75,
  fontWeight: 600,
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  color: 'text.secondary',
};

export const filterChipWrapSx: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 0.5,
};

export const filterChipSx: SxProps<Theme> = {
  maxWidth: '100%',
  height: 'auto',
  '& .MuiChip-label': {
    whiteSpace: 'normal',
    lineHeight: 1.25,
  },
};
