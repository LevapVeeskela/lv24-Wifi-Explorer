import type { WidthFilterValue } from '@/features/scan-filters';
import { useScanIntl } from '@/shared/i18n';
import type { WidthFacet as WidthFacetItem } from './buildAutoFilterFacets';
import { FacetChip } from './FacetChip';
import { FacetSection } from './FacetSection';

function widthLabel(widthMhz: WidthFilterValue): string {
  return `${widthMhz} MHz`;
}

export type WidthFacetProps = {
  widths: readonly WidthFacetItem[];
  selected: WidthFilterValue | null | undefined;
  onToggle: (widthMhz: WidthFilterValue) => void;
};

export function WidthFacet({ widths, selected, onToggle }: WidthFacetProps) {
  const { formatMessage } = useScanIntl();

  return (
    <FacetSection title={formatMessage('scan.filterSidebar.section.width')}>
      {widths.map(({ widthMhz, count }) => (
        <FacetChip
          key={widthMhz}
          label={formatMessage('scan.filterSidebar.chipCount', {
            label: widthLabel(widthMhz),
            count,
          })}
          selected={selected === widthMhz}
          onClick={() => onToggle(widthMhz)}
        />
      ))}
    </FacetSection>
  );
}
