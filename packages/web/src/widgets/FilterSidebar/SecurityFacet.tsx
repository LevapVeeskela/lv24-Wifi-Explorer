import { Chip } from '@mui/material';
import type { SecurityFilterValue } from '@/features/scan-filters';
import { useScanIntl } from '@/shared/i18n';
import type { MessageKey } from '@/shared/i18n';
import type { SecurityFacet as SecurityFacetItem } from './buildAutoFilterFacets';
import { FacetSection } from './FacetSection';
import { filterChipSx } from './styles';

export type SecurityFacetProps = {
  security: readonly SecurityFacetItem[];
  selected: readonly SecurityFilterValue[];
  onToggle: (id: SecurityFilterValue) => void;
};

export function SecurityFacet({ security, selected, onToggle }: SecurityFacetProps) {
  const { formatMessage } = useScanIntl();

  return (
    <FacetSection title={formatMessage('scan.filterSidebar.section.security')}>
      {security.map(({ id, count }) => {
        const isSelected = selected.includes(id);
        const labelKey: MessageKey = id === 'open' ? 'scan.filter.open' : 'scan.filter.secure';
        return (
          <Chip
            key={id}
            clickable
            color={isSelected ? 'primary' : 'default'}
            label={formatMessage('scan.filterSidebar.chipCount', {
              label: formatMessage(labelKey),
              count,
            })}
            size="small"
            sx={filterChipSx}
            variant={isSelected ? 'filled' : 'outlined'}
            onClick={() => onToggle(id)}
          />
        );
      })}
    </FacetSection>
  );
}
