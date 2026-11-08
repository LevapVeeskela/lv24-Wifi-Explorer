import { Chip } from '@mui/material';
import { useScanIntl } from '@/shared/i18n';
import type { VendorFacet as VendorFacetItem } from './buildAutoFilterFacets';
import { vendorQueryMatchesLabel } from './buildAutoFilterFacets';
import { FacetSection } from './FacetSection';
import { filterChipSx } from './styles';

export type VendorFacetProps = {
  vendors: readonly VendorFacetItem[];
  vendorQuery: string;
  onToggle: (label: string) => void;
};

export function VendorFacet({ vendors, vendorQuery, onToggle }: VendorFacetProps) {
  const { formatMessage } = useScanIntl();
  const vendorDisplay = (label: string) =>
    label ? label : formatMessage('scan.filterSidebar.vendor.unknown');

  return (
    <FacetSection title={formatMessage('scan.filterSidebar.section.vendor')}>
      {vendors.map(({ label, count }) => {
        const selected = vendorQueryMatchesLabel(vendorQuery, label);
        return (
          <Chip
            key={label || '__unknown__'}
            clickable
            color={selected ? 'primary' : 'default'}
            label={formatMessage('scan.filterSidebar.chipCount', {
              label: vendorDisplay(label),
              count,
            })}
            size="small"
            sx={filterChipSx}
            variant={selected ? 'filled' : 'outlined'}
            onClick={() => onToggle(label)}
          />
        );
      })}
    </FacetSection>
  );
}
