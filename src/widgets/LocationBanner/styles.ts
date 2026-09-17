import type { SxProps, Theme } from '@mui/material';

export const locationBannerSx: SxProps<Theme> = {
  flexShrink: 0,
  borderRadius: 0,
  borderBottom: 1,
  borderColor: 'divider',
  '& .MuiAlert-message': {
    width: '100%',
  },
};
