import type { SxProps, Theme } from '@mui/material';

export const advancedEmptySx: SxProps<Theme> = {
  px: 2,
  py: 1,
  minHeight: 72,
  alignItems: 'center',
  justifyContent: 'center',
};

export const advancedEmptyTextSx: SxProps<Theme> = {
  color: 'text.secondary',
};

export const advancedStackSx: SxProps<Theme> = {
  overflow: 'auto',
};

export const advancedChipRowSx: SxProps<Theme> = {
  flexWrap: 'wrap',
  gap: 0.5,
};

export const advancedDetailsSx: SxProps<Theme> = {
  px: 2,
  pb: 1.5,
};
