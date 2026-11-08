import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { filterChipWrapSx, filterSectionSx, filterSectionTitleSx } from './styles';

export type FacetSectionProps = {
  title: string;
  children: ReactNode;
};

export function FacetSection({ title, children }: FacetSectionProps) {
  return (
    <Box sx={filterSectionSx}>
      <Typography component="span" sx={filterSectionTitleSx} variant="caption">
        {title}
      </Typography>
      <Box sx={filterChipWrapSx}>{children}</Box>
    </Box>
  );
}
