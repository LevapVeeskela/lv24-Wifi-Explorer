import type { SxProps, Theme } from '@mui/material';

export const detailsPaneSx: SxProps<Theme> = {
  px: 2,
  py: 1,
  overflow: 'auto',
};

export const detailsEmptySx: SxProps<Theme> = {
  px: 2,
  py: 1,
  flex: 1,
  minHeight: 72,
  alignItems: 'center',
  justifyContent: 'center',
};

export const detailsEmptyTextSx: SxProps<Theme> = {
  color: 'text.secondary',
};

export const detailsFieldSx: SxProps<Theme> = {
  minWidth: 0,
};

export const detailsFieldLabelSx: SxProps<Theme> = {
  color: 'text.secondary',
};

export const detailsValueSx: SxProps<Theme> = {
  color: 'text.primary',
};

export const detailsValueMonoSx: SxProps<Theme> = {
  color: 'text.primary',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
};

export const detailsCopyButtonSx: SxProps<Theme> = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  borderRadius: 1,
  px: 0.25,
  '&:hover': {
    backgroundColor: 'action.hover',
  },
};

export const detailsSnackbarSx: SxProps<Theme> = {
  '& .MuiSnackbarContent-root': {
    minWidth: 0,
  },
};
