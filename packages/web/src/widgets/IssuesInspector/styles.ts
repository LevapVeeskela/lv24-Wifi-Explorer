import type { SxProps, Theme } from '@mui/material';

export const issuesInspectorRootSx: SxProps<Theme> = {
  p: 1,
};

export const issuesInspectorSummarySx: SxProps<Theme> = {
  display: 'block',
  mb: 1,
  color: 'text.secondary',
};

export const issueGroupSx: SxProps<Theme> = {
  mb: 1.5,
};

export const issueGroupHeaderSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  mb: 0.5,
};

export const issueGroupTitleSx: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
  fontWeight: 600,
};

export const issueBssButtonSx: SxProps<Theme> = {
  borderRadius: 1,
  px: 1,
  py: 0.25,
};
