import type { SxProps, Theme } from '@mui/material';

export const advancedIeTreeRootSx: SxProps<Theme> = {
  px: 0,
  pb: 1,
};

export const advancedIeTreeEmptySx: SxProps<Theme> = {
  px: 2,
  py: 1,
  color: 'text.secondary',
};

export const advancedIeTreeToolbarSx: SxProps<Theme> = {
  px: 1,
  pb: 0.5,
  alignItems: 'center',
  flexWrap: 'wrap',
  rowGap: 0.5,
};

export const advancedIeTreeRowSx = (depth: number): SxProps<Theme> => ({
  display: 'flex',
  flexDirection: 'row',
  gap: 0.75,
  pl: 1 + depth * 1.5,
  py: 0.25,
  alignItems: 'baseline',
});

export const advancedIeTreeElementRowSx = (depth: number): SxProps<Theme> => ({
  display: 'flex',
  flexDirection: 'row',
  gap: 0.5,
  pl: 0.5 + depth * 1.5,
  py: 0.25,
  mt: 1,
  alignItems: 'center',
});

export const advancedIeTreeLabelSx: SxProps<Theme> = {
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  color: 'text.secondary',
  flexShrink: 0,
};

export const advancedIeTreeValueSx: SxProps<Theme> = {
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  wordBreak: 'break-all',
};

export const advancedIeTreeElementTitleSx: SxProps<Theme> = {
  fontWeight: 600,
  fontSize: '0.8125rem',
};

export const advancedIeTreeBytesSx: SxProps<Theme> = {
  fontFamily: 'monospace',
  fontSize: '0.6875rem',
  color: 'text.secondary',
  border: 1,
  borderColor: 'divider',
  borderRadius: 0.5,
  px: 0.5,
  flexShrink: 0,
};
