import { useMemo } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import FilterList from '@mui/icons-material/FilterList';
import FilterAltOff from '@mui/icons-material/FilterAltOff';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import {
  FILTER_DEFAULTS,
  type BandFilterValue,
  type ScanWorkbenchFilters,
  type SecurityFilterValue,
} from '@/features/scan-filters';
import { useScanIntl } from '@/shared/i18n/ScanIntlProvider';
import type { MessageKey } from '@/shared/i18n';
import {
  buildAutoFilterFacets,
  vendorQueryMatchesLabel,
} from './buildAutoFilterFacets';
import {
  filterChipSx,
  filterChipWrapSx,
  filterSectionSx,
  filterSectionTitleSx,
  filterSidebarHeaderSx,
  filterSidebarRootSx,
  filterSidebarScrollSx,
} from './styles';
import { useFilterSidebarCollapsed } from './useFilterSidebarCollapsed';

export type FilterSidebarProps = {
  rows: readonly ScanGridRow[];
  filters: ScanWorkbenchFilters;
  onFiltersChange: (next: ScanWorkbenchFilters) => void;
};

const BAND_LABEL: Record<Exclude<BandFilterValue, 'all'>, MessageKey> = {
  '24': 'scan.filter.band.24',
  '5': 'scan.filter.band.5',
  '6': 'scan.filter.band.6',
};

function toggleSecurity(
  current: SecurityFilterValue[],
  id: SecurityFilterValue,
): SecurityFilterValue[] {
  if (current.includes(id)) {
    return current.filter((value) => value !== id);
  }
  return [...current, id];
}

export function FilterSidebar({ rows, filters, onFiltersChange }: FilterSidebarProps) {
  const { formatMessage } = useScanIntl();
  const [collapsed, setCollapsed] = useFilterSidebarCollapsed();
  const facets = useMemo(() => buildAutoFilterFacets(rows), [rows]);

  const sidebarFiltersActive =
    filters.band !== 'all' ||
    filters.security.length > 0 ||
    filters.vendorQuery.trim().length > 0;

  const onBandChip = (band: Exclude<BandFilterValue, 'all'>) => {
    onFiltersChange({
      ...filters,
      band: filters.band === band ? 'all' : band,
    });
  };

  const onSecurityChip = (id: SecurityFilterValue) => {
    onFiltersChange({
      ...filters,
      security: toggleSecurity(filters.security, id),
    });
  };

  const onVendorChip = (label: string) => {
    const active = vendorQueryMatchesLabel(filters.vendorQuery, label);
    onFiltersChange({
      ...filters,
      vendorQuery: active ? '' : label,
    });
  };

  const clearSidebarFilters = () => {
    onFiltersChange({
      ...filters,
      band: FILTER_DEFAULTS.band,
      security: FILTER_DEFAULTS.security,
      vendorQuery: FILTER_DEFAULTS.vendorQuery,
    });
  };

  const vendorDisplay = (label: string) =>
    label ? label : formatMessage('scan.filterSidebar.vendor.unknown');

  if (collapsed) {
    return (
      <Box
        aria-label={formatMessage('scan.filterSidebar.title')}
        component="aside"
        sx={filterSidebarRootSx(true)}
      >
        <Stack spacing={0.5} sx={{ alignItems: 'center', py: 1 }}>
          <Tooltip title={formatMessage('scan.filterSidebar.expand')}>
            <IconButton
              aria-expanded={false}
              aria-label={formatMessage('scan.filterSidebar.expand')}
              size="small"
              onClick={() => setCollapsed(false)}
            >
              <ChevronRight fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={formatMessage('scan.filterSidebar.title')}>
            <FilterList
              aria-hidden
              color={sidebarFiltersActive ? 'primary' : 'action'}
              fontSize="small"
            />
          </Tooltip>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      aria-label={formatMessage('scan.filterSidebar.title')}
      component="aside"
      id="scan-filter-sidebar"
      sx={filterSidebarRootSx(false)}
    >
      <Box sx={filterSidebarHeaderSx}>
        <Typography component="h2" noWrap variant="subtitle2">
          {formatMessage('scan.filterSidebar.title')}
        </Typography>
        <Stack direction="row" spacing={0.25}>
          {sidebarFiltersActive ? (
            <Tooltip title={formatMessage('scan.filterSidebar.clear')}>
              <IconButton
                aria-label={formatMessage('scan.filterSidebar.clear')}
                size="small"
                onClick={clearSidebarFilters}
              >
                <FilterAltOff fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
          <Tooltip title={formatMessage('scan.filterSidebar.collapse')}>
            <IconButton
              aria-expanded
              aria-label={formatMessage('scan.filterSidebar.collapse')}
              size="small"
              onClick={() => setCollapsed(true)}
            >
              <ChevronLeft fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <Box sx={filterSidebarScrollSx}>
        {facets.bands.length > 0 ? (
          <Box sx={filterSectionSx}>
            <Typography component="span" sx={filterSectionTitleSx} variant="caption">
              {formatMessage('scan.filterSidebar.section.band')}
            </Typography>
            <Box sx={filterChipWrapSx}>
              <Chip
                clickable
                color={filters.band === 'all' ? 'primary' : 'default'}
                label={formatMessage('scan.filterSidebar.chipCount', {
                  label: formatMessage('scan.filter.band.all'),
                  count: rows.length,
                })}
                size="small"
                sx={filterChipSx}
                variant={filters.band === 'all' ? 'filled' : 'outlined'}
                onClick={() => onFiltersChange({ ...filters, band: 'all' })}
              />
              {facets.bands.map(({ id, count }) => (
                <Chip
                  key={id}
                  clickable
                  color={filters.band === id ? 'primary' : 'default'}
                  label={formatMessage('scan.filterSidebar.chipCount', {
                    label: formatMessage(BAND_LABEL[id]),
                    count,
                  })}
                  size="small"
                  sx={filterChipSx}
                  variant={filters.band === id ? 'filled' : 'outlined'}
                  onClick={() => onBandChip(id)}
                />
              ))}
            </Box>
          </Box>
        ) : null}

        {facets.security.length > 0 ? (
          <Box sx={filterSectionSx}>
            <Typography component="span" sx={filterSectionTitleSx} variant="caption">
              {formatMessage('scan.filterSidebar.section.security')}
            </Typography>
            <Box sx={filterChipWrapSx}>
              {facets.security.map(({ id, count }) => {
                const selected = filters.security.includes(id);
                const labelKey: MessageKey =
                  id === 'open' ? 'scan.filter.open' : 'scan.filter.secure';
                return (
                  <Chip
                    key={id}
                    clickable
                    color={selected ? 'primary' : 'default'}
                    label={formatMessage('scan.filterSidebar.chipCount', {
                      label: formatMessage(labelKey),
                      count,
                    })}
                    size="small"
                    sx={filterChipSx}
                    variant={selected ? 'filled' : 'outlined'}
                    onClick={() => onSecurityChip(id)}
                  />
                );
              })}
            </Box>
          </Box>
        ) : null}

        {facets.vendors.length > 0 ? (
          <Box sx={filterSectionSx}>
            <Typography component="span" sx={filterSectionTitleSx} variant="caption">
              {formatMessage('scan.filterSidebar.section.vendor')}
            </Typography>
            <Box sx={filterChipWrapSx}>
              {facets.vendors.map(({ label, count }) => {
                const selected = vendorQueryMatchesLabel(filters.vendorQuery, label);
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
                    onClick={() => onVendorChip(label)}
                  />
                );
              })}
            </Box>
          </Box>
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
