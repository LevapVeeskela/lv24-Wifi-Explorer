import type { SxProps, Theme } from '@mui/material';

export const comparePaneRootSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  minHeight: 0,
  flex: 1,
  overflow: 'hidden',
};

export const compareHintSx: SxProps<Theme> = {
  px: 2,
  py: 3,
  color: 'text.secondary',
};

export const compareTableWrapSx: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  px: 1,
  pb: 1,
};

export const compareHeaderSwatchSx = (color: string): SxProps<Theme> => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  bgcolor: color,
  flexShrink: 0,
});

export const compareDiffCellSx: SxProps<Theme> = {
  bgcolor: (theme) =>
    theme.palette.mode === 'dark' ? 'rgba(251, 110, 74, 0.12)' : 'rgba(241, 90, 54, 0.08)',
};

export const compareLabelCellSx: SxProps<Theme> = {
  fontWeight: 600,
  color: 'text.secondary',
  whiteSpace: 'nowrap',
  position: 'sticky',
  left: 0,
  bgcolor: 'background.paper',
  zIndex: 1,
};

export const compareIeSectionSx: SxProps<Theme> = {
  mt: 2,
  borderTop: 1,
  borderColor: 'divider',
};

export const compareIeHeadSx: SxProps<Theme> = {
  alignItems: 'center',
  px: 1,
  pt: 1.5,
  pb: 0.5,
};

export const compareValueMonoSx: SxProps<Theme> = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '0.8125rem',
};
