import { useScanIntl } from '@/shared/i18n';
import { FacetChip } from './FacetChip';
import { FacetSection } from './FacetSection';

export type AnnotationsFacetProps = {
  count: number;
  selected: boolean;
  onToggle: () => void;
};

export function AnnotationsFacet({ count, selected, onToggle }: AnnotationsFacetProps) {
  const { formatMessage } = useScanIntl();

  return (
    <FacetSection title={formatMessage('scan.filterSidebar.section.annotations')}>
      <FacetChip
        label={formatMessage('scan.filterSidebar.chipCount', {
          label: formatMessage('scan.filterSidebar.section.annotations'),
          count,
        })}
        selected={selected}
        onClick={onToggle}
      />
    </FacetSection>
  );
}
