import { useMemo } from 'react';
import {
  Box,
  Chip,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import FilterList from '@mui/icons-material/FilterList';
import FilterAltOff from '@mui/icons-material/FilterAltOff';
import type { ScanGridRow } from '@/entities/bss';
import type { ScanIssueId } from '@/features/scan-issues';
import {
  FILTER_DEFAULTS,
  type BandFilterValue,
  type NetworkTypeFilterValue,
  type ScanWorkbenchFilters,
  type SecurityFilterValue,
  type WidthFilterValue,
} from '@/features/scan-filters';
import { useScanIntl } from '@/shared/i18n';
import type { MessageKey } from '@/shared/i18n';
import { buildAutoFilterFacets, vendorQueryMatchesLabel } from './buildAutoFilterFacets';
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
  id: SecurityFilterValue
): SecurityFilterValue[] {
  if (current.includes(id)) {
    return current.filter((value) => value !== id);
  }
  return [...current, id];
}

type FacetChipProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
};

function FacetChip({ label, selected, onClick }: FacetChipProps) {
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

function widthLabel(widthMhz: WidthFilterValue): string {
  return `${widthMhz} MHz`;
}

export function FilterSidebar({ rows, filters, onFiltersChange }: FilterSidebarProps) {
  const { formatMessage } = useScanIntl();
  const [collapsed, setCollapsed] = useFilterSidebarCollapsed();
  const facets = useMemo(() => buildAutoFilterFacets(rows), [rows]);

  const sidebarFiltersActive =
    filters.band !== 'all' ||
    filters.security.length > 0 ||
    filters.vendorQuery.trim().length > 0 ||
    (filters.issueIds?.length ?? 0) > 0 ||
    filters.channel != null ||
    filters.widthMhz != null ||
    (filters.phy ?? '').length > 0 ||
    filters.networkType != null ||
    filters.annotatedOnly === true ||
    filters.selectedOnly === true;

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

  const activeIssueIds = filters.issueIds ?? [];
  const annotatedFacet = facets.annotations.find((facet) => facet.id === 'annotated');

  const onIssueChip = (id: ScanIssueId) => {
    onFiltersChange({
      ...filters,
      issueIds: activeIssueIds.includes(id)
        ? activeIssueIds.filter((value) => value !== id)
        : [...activeIssueIds, id],
    });
  };

  const toggleChannel = (channel: number) => {
    onFiltersChange({ ...filters, channel: filters.channel === channel ? null : channel });
  };

  const toggleWidth = (widthMhz: WidthFilterValue) => {
    onFiltersChange({ ...filters, widthMhz: filters.widthMhz === widthMhz ? null : widthMhz });
  };

  const togglePhy = (phy: string) => {
    onFiltersChange({ ...filters, phy: filters.phy === phy ? null : phy });
  };

  const toggleNetworkType = (networkType: NetworkTypeFilterValue) => {
    onFiltersChange({
      ...filters,
      networkType: filters.networkType === networkType ? null : networkType,
    });
  };

  const toggleAnnotatedOnly = () => {
    onFiltersChange({ ...filters, annotatedOnly: !filters.annotatedOnly });
  };

  const onSelectedOnlyChange = (checked: boolean) => {
    onFiltersChange({ ...filters, selectedOnly: checked });
  };

  const clearSidebarFilters = () => {
    onFiltersChange({
      ...filters,
      band: FILTER_DEFAULTS.band,
      security: [...FILTER_DEFAULTS.security],
      vendorQuery: FILTER_DEFAULTS.vendorQuery,
      issueIds: [],
      channel: null,
      widthMhz: null,
      phy: null,
      networkType: null,
      annotatedOnly: false,
      selectedOnly: false,
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
        <FormControlLabel
          control={
            <Switch
              checked={filters.selectedOnly === true}
              onChange={(e) => onSelectedOnlyChange(e.target.checked)}
              size="small"
            />
          }
          label={formatMessage('scan.filterSidebar.selectedOnly')}
          sx={{ mb: 1, ml: 0, '& .MuiFormControlLabel-label': { typography: 'caption' } }}
        />
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

        {facets.channels.length > 0 ? (
          <Box sx={filterSectionSx}>
            <Typography component="span" sx={filterSectionTitleSx} variant="caption">
              {formatMessage('scan.filterSidebar.section.channel')}
            </Typography>
            <Box sx={filterChipWrapSx}>
              {facets.channels.map(({ channel, count }) => (
                <FacetChip
                  key={channel}
                  label={formatMessage('scan.filterSidebar.chipCount', {
                    label: String(channel),
                    count,
                  })}
                  selected={filters.channel === channel}
                  onClick={() => toggleChannel(channel)}
                />
              ))}
            </Box>
          </Box>
        ) : null}

        {facets.widths.length > 0 ? (
          <Box sx={filterSectionSx}>
            <Typography component="span" sx={filterSectionTitleSx} variant="caption">
              {formatMessage('scan.filterSidebar.section.width')}
            </Typography>
            <Box sx={filterChipWrapSx}>
              {facets.widths.map(({ widthMhz, count }) => (
                <FacetChip
                  key={widthMhz}
                  label={formatMessage('scan.filterSidebar.chipCount', {
                    label: widthLabel(widthMhz),
                    count,
                  })}
                  selected={filters.widthMhz === widthMhz}
                  onClick={() => toggleWidth(widthMhz)}
                />
              ))}
            </Box>
          </Box>
        ) : null}

        {facets.phys.length > 0 ? (
          <Box sx={filterSectionSx}>
            <Typography component="span" sx={filterSectionTitleSx} variant="caption">
              {formatMessage('scan.filterSidebar.section.phy')}
            </Typography>
            <Box sx={filterChipWrapSx}>
              {facets.phys.map(({ phy, count }) => (
                <FacetChip
                  key={phy}
                  label={formatMessage('scan.filterSidebar.chipCount', {
                    label: phy.toUpperCase(),
                    count,
                  })}
                  selected={(filters.phy ?? '').toLowerCase() === phy}
                  onClick={() => togglePhy(phy)}
                />
              ))}
            </Box>
          </Box>
        ) : null}

        {facets.networkTypes.length > 0 ? (
          <Box sx={filterSectionSx}>
            <Typography component="span" sx={filterSectionTitleSx} variant="caption">
              {formatMessage('scan.filterSidebar.section.type')}
            </Typography>
            <Box sx={filterChipWrapSx}>
              {facets.networkTypes.map(({ id, count }) => (
                <FacetChip
                  key={id}
                  label={formatMessage('scan.filterSidebar.chipCount', {
                    label: formatMessage(
                      id === 'infrastructure' ? 'scan.type.infrastructure' : 'scan.type.ibss'
                    ),
                    count,
                  })}
                  selected={filters.networkType === id}
                  onClick={() => toggleNetworkType(id)}
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

        {annotatedFacet && annotatedFacet.count > 0 ? (
          <Box sx={filterSectionSx}>
            <Typography component="span" sx={filterSectionTitleSx} variant="caption">
              {formatMessage('scan.filterSidebar.section.annotations')}
            </Typography>
            <Box sx={filterChipWrapSx}>
              <FacetChip
                label={formatMessage('scan.filterSidebar.chipCount', {
                  label: formatMessage('scan.filterSidebar.section.annotations'),
                  count: annotatedFacet.count,
                })}
                selected={filters.annotatedOnly === true}
                onClick={toggleAnnotatedOnly}
              />
            </Box>
          </Box>
        ) : null}

        {facets.issues.length > 0 ? (
          <Box sx={filterSectionSx}>
            <Typography component="span" sx={filterSectionTitleSx} variant="caption">
              {formatMessage('scan.filterSidebar.section.issues')}
            </Typography>
            <Box sx={filterChipWrapSx}>
              {facets.issues.map(({ id, count }) => {
                const selected = activeIssueIds.includes(id);
                return (
                  <Chip
                    key={id}
                    clickable
                    color={selected ? 'primary' : 'default'}
                    label={formatMessage('scan.filterSidebar.issueCount', {
                      label: formatMessage(`scan.issue.${id}`),
                      count,
                    })}
                    size="small"
                    sx={filterChipSx}
                    variant={selected ? 'filled' : 'outlined'}
                    onClick={() => onIssueChip(id)}
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
