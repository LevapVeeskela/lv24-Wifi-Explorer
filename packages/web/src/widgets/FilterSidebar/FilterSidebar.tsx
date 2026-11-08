import { Box, FormControlLabel, Switch, Typography } from '@mui/material';
import type { ScanGridRow } from '@/entities/bss';
import type { ScanWorkbenchFilters } from '@/features/scan-filters';
import { useScanIntl } from '@/shared/i18n';
import { AnnotationsFacet } from './AnnotationsFacet';
import { BandFacet } from './BandFacet';
import { ChannelFacet } from './ChannelFacet';
import { FilterSidebarCollapsedRail } from './FilterSidebarCollapsedRail';
import { FilterSidebarHeader } from './FilterSidebarHeader';
import { IssuesFacet } from './IssuesFacet';
import { NetworkTypeFacet } from './NetworkTypeFacet';
import { PhyFacet } from './PhyFacet';
import { SecurityFacet } from './SecurityFacet';
import { filterSidebarRootSx, filterSidebarScrollSx } from './styles';
import { useFilterSidebarState } from './useFilterSidebarState';
import { VendorFacet } from './VendorFacet';
import { WidthFacet } from './WidthFacet';

export type FilterSidebarProps = {
  rows: readonly ScanGridRow[];
  filters: ScanWorkbenchFilters;
  onFiltersChange: (next: ScanWorkbenchFilters) => void;
};

export function FilterSidebar({ rows, filters, onFiltersChange }: FilterSidebarProps) {
  const { formatMessage } = useScanIntl();
  const state = useFilterSidebarState({ rows, filters, onFiltersChange });
  const { facets } = state;

  if (state.collapsed) {
    return (
      <FilterSidebarCollapsedRail
        filtersActive={state.sidebarFiltersActive}
        onExpand={() => state.setCollapsed(false)}
      />
    );
  }

  return (
    <Box
      aria-label={formatMessage('scan.filterSidebar.title')}
      component="aside"
      id="scan-filter-sidebar"
      sx={filterSidebarRootSx(false)}
    >
      <FilterSidebarHeader
        filtersActive={state.sidebarFiltersActive}
        onClear={state.clearSidebarFilters}
        onCollapse={() => state.setCollapsed(true)}
      />

      <Box sx={filterSidebarScrollSx}>
        <FormControlLabel
          control={
            <Switch
              checked={filters.selectedOnly === true}
              onChange={(e) => state.onSelectedOnlyChange(e.target.checked)}
              size="small"
            />
          }
          label={formatMessage('scan.filterSidebar.selectedOnly')}
          sx={{ mb: 1, ml: 0, '& .MuiFormControlLabel-label': { typography: 'caption' } }}
        />
        {facets.bands.length > 0 ? (
          <BandFacet
            bands={facets.bands}
            totalCount={rows.length}
            selected={filters.band}
            onSelectAll={() => onFiltersChange({ ...filters, band: 'all' })}
            onSelect={state.onBandChip}
          />
        ) : null}

        {facets.channels.length > 0 ? (
          <ChannelFacet
            channels={facets.channels}
            selected={filters.channel}
            onToggle={state.toggleChannel}
          />
        ) : null}

        {facets.widths.length > 0 ? (
          <WidthFacet
            widths={facets.widths}
            selected={filters.widthMhz}
            onToggle={state.toggleWidth}
          />
        ) : null}

        {facets.phys.length > 0 ? (
          <PhyFacet phys={facets.phys} selectedPhy={filters.phy} onToggle={state.togglePhy} />
        ) : null}

        {facets.networkTypes.length > 0 ? (
          <NetworkTypeFacet
            networkTypes={facets.networkTypes}
            selected={filters.networkType}
            onToggle={state.toggleNetworkType}
          />
        ) : null}

        {facets.security.length > 0 ? (
          <SecurityFacet
            security={facets.security}
            selected={filters.security}
            onToggle={state.onSecurityChip}
          />
        ) : null}

        {facets.vendors.length > 0 ? (
          <VendorFacet
            vendors={facets.vendors}
            vendorQuery={filters.vendorQuery}
            onToggle={state.onVendorChip}
          />
        ) : null}

        {state.annotatedFacet && state.annotatedFacet.count > 0 ? (
          <AnnotationsFacet
            count={state.annotatedFacet.count}
            selected={filters.annotatedOnly === true}
            onToggle={state.toggleAnnotatedOnly}
          />
        ) : null}

        {facets.issues.length > 0 ? (
          <IssuesFacet
            issues={facets.issues}
            selectedIds={state.activeIssueIds}
            onToggle={state.onIssueChip}
          />
        ) : null}

        {rows.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            {formatMessage('scan.filterSidebar.empty')}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}
