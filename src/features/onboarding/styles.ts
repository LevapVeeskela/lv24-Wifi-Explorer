import type { SxProps, Theme } from '@mui/material';

export const locationOnboardingPaperSx: SxProps<Theme> = {
  borderRadius: 2.5,
};

export const locationOnboardingContentSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1.5,
  pt: 0.5,
};

export const locationOnboardingBodySx: SxProps<Theme> = {
  color: 'text.primary',
};

export const locationOnboardingActionsSx: SxProps<Theme> = {
  px: 3,
  pb: 2,
  gap: 1,
};
