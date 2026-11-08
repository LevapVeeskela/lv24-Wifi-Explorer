import { useScanIntl } from '@/shared/i18n';
import type { PhyFacet as PhyFacetItem } from './buildAutoFilterFacets';
import { FacetChip } from './FacetChip';
import { FacetSection } from './FacetSection';

export type PhyFacetProps = {
  phys: readonly PhyFacetItem[];
  selectedPhy: string | null | undefined;
  onToggle: (phy: string) => void;
};

export function PhyFacet({ phys, selectedPhy, onToggle }: PhyFacetProps) {
  const { formatMessage } = useScanIntl();

  return (
    <FacetSection title={formatMessage('scan.filterSidebar.section.phy')}>
      {phys.map(({ phy, count }) => (
        <FacetChip
          key={phy}
          label={formatMessage('scan.filterSidebar.chipCount', {
            label: phy.toUpperCase(),
            count,
          })}
          selected={(selectedPhy ?? '').toLowerCase() === phy}
          onClick={() => onToggle(phy)}
        />
      ))}
    </FacetSection>
  );
}
