import type { SxProps, Theme } from '@mui/material';

export const chartStripSx: SxProps<Theme> = {
  p: 1,
  minHeight: 160,
};

export const occupancyStripSx: SxProps<Theme> = {
  p: 1,
};

export const chartPaperSx: SxProps<Theme> = {
  p: 1,
  height: '100%',
  minHeight: 140,
  borderRadius: 0,
  display: 'flex',
  flexDirection: 'column',
  outline: 'none',
  '&:focus-visible': {
    boxShadow: (theme) => `inset 0 0 0 2px ${theme.palette.primary.main}`,
  },
};

export const chartHeaderSx: SxProps<Theme> = {
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  columnGap: 1,
  rowGap: 0.5,
  mb: 0.5,
};

export const chartTitleSx: SxProps<Theme> = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export const chartCaptionSx: SxProps<Theme> = {
  color: 'text.secondary',
  mt: 0.5,
};

export const chartStatsSx: SxProps<Theme> = {
  color: 'text.secondary',
  fontVariantNumeric: 'tabular-nums',
};

export const chartEmptySx: SxProps<Theme> = {
  color: 'text.secondary',
};

export const chartVisuallyHiddenSx: SxProps<Theme> = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: 1,
  maxWidth: 1,
  height: 1,
  maxHeight: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
};

export const chartToolbarSx: SxProps<Theme> = {
  alignItems: 'center',
  flexWrap: 'wrap',
  columnGap: 0.5,
  rowGap: 0.5,
  minWidth: 0,
};

export const signalChartAverageColor = '#94a3b8';
export const signalChartMaxColor = '#f59e0b';
export const signalChartTracesSx: SxProps<Theme> = {
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 0.5,
  mt: 0.5,
};
