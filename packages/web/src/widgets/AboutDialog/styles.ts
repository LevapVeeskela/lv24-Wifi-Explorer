import type { SxProps, Theme } from '@mui/material';

export const aboutDialogPaperSx: SxProps<Theme> = {
  borderRadius: 2.5,
};

export const aboutTitleSx: SxProps<Theme> = {
  pb: 0.5,
};

export const aboutContentSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1.25,
  pt: 1,
};

export const aboutProductSx: SxProps<Theme> = {
  fontWeight: 700,
};

export const aboutVersionSx: SxProps<Theme> = {
  color: 'text.secondary',
};

export const aboutBodySx: SxProps<Theme> = {
  color: 'text.primary',
};

export const aboutCaptionSx: SxProps<Theme> = {
  color: 'text.secondary',
  display: 'block',
  pt: 0.5,
};

export const aboutActionsSx: SxProps<Theme> = {
  px: 3,
  pb: 2,
};
