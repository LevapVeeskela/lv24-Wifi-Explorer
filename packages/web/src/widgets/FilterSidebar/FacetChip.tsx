import { Chip } from '@mui/material';
import { filterChipSx } from './styles';

export type FacetChipProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
};

export function FacetChip({ label, selected, onClick }: FacetChipProps) {
  return (
    <Chip
      clickable
      color={selected ? 'primary' : 'default'}
      label={label}
      size="small"
      sx={filterChipSx}
      variant={selected ? 'filled' : 'outlined'}
      onClick={onClick}
    />
  );
}
