import { Chip } from '@mui/material';
import type { BandFilterValue } from '@/features/scan-filters';
import { useScanIntl } from '@/shared/i18n';
import type { MessageKey } from '@/shared/i18n';
import type { BandFacet as BandFacetItem } from './buildAutoFilterFacets';
import { FacetSection } from './FacetSection';
import { filterChipSx } from './styles';

const BAND_LABEL: Record<Exclude<BandFilterValue, 'all'>, MessageKey> = {
  '24': 'scan.filter.band.24',
  '5': 'scan.filter.band.5',
  '6': 'scan.filter.band.6',
};

export type BandFacetProps = {
  bands: readonly BandFacetItem[];
  totalCount: number;
  selected: BandFilterValue;
  onSelectAll: () => void;
  onSelect: (band: Exclude<BandFilterValue, 'all'>) => void;
};

export function BandFacet({ bands, totalCount, selected, onSelectAll, onSelect }: BandFacetProps) {
  const { formatMessage } = useScanIntl();

  return (
    <FacetSection title={formatMessage('scan.filterSidebar.section.band')}>
      <Chip
        clickable
        color={selected === 'all' ? 'primary' : 'default'}
        label={formatMessage('scan.filterSidebar.chipCount', {
          label: formatMessage('scan.filter.band.all'),
          count: totalCount,
        })}
        size="small"
        sx={filterChipSx}
        variant={selected === 'all' ? 'filled' : 'outlined'}
        onClick={onSelectAll}
      />
      {bands.map(({ id, count }) => (
        <Chip
          key={id}
          clickable
          color={selected === id ? 'primary' : 'default'}
          label={formatMessage('scan.filterSidebar.chipCount', {
            label: formatMessage(BAND_LABEL[id]),
            count,
          })}
          size="small"
          sx={filterChipSx}
          variant={selected === id ? 'filled' : 'outlined'}
          onClick={() => onSelect(id)}
        />
      ))}
    </FacetSection>
  );
}
