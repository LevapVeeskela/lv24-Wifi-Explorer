import type { NetworkTypeFilterValue } from '@/features/scan-filters';
import { useScanIntl } from '@/shared/i18n';
import type { NetworkTypeFacet as NetworkTypeFacetItem } from './buildAutoFilterFacets';
import { FacetChip } from './FacetChip';
import { FacetSection } from './FacetSection';

export type NetworkTypeFacetProps = {
  networkTypes: readonly NetworkTypeFacetItem[];
  selected: NetworkTypeFilterValue | null | undefined;
  onToggle: (networkType: NetworkTypeFilterValue) => void;
};

export function NetworkTypeFacet({ networkTypes, selected, onToggle }: NetworkTypeFacetProps) {
  const { formatMessage } = useScanIntl();

  return (
    <FacetSection title={formatMessage('scan.filterSidebar.section.type')}>
      {networkTypes.map(({ id, count }) => (
        <FacetChip
          key={id}
          label={formatMessage('scan.filterSidebar.chipCount', {
            label: formatMessage(
              id === 'infrastructure' ? 'scan.type.infrastructure' : 'scan.type.ibss'
            ),
            count,
          })}
          selected={selected === id}
          onClick={() => onToggle(id)}
        />
      ))}
    </FacetSection>
  );
}
