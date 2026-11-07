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

export const advancedIeTreeRowSx = (depth: number): SxProps<Theme> => ({
  display: 'flex',
  flexDirection: 'row',
  gap: 0.75,
  pl: 1 + depth * 1.5,
  py: 0.25,
  alignItems: 'baseline',
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
  mt: 1,
  mb: 0.25,
};
