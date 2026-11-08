import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  AppBar,
  Autocomplete,
  FormControl,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import Settings from '@mui/icons-material/Settings';
import Search from '@mui/icons-material/Search';
import Clear from '@mui/icons-material/Clear';
import History from '@mui/icons-material/History';
import FileDownload from '@mui/icons-material/FileDownload';
import ViewColumn from '@mui/icons-material/ViewColumn';
import type { CsvExportScope } from '@/features/export';
import type { OrganizeByValue } from '@/features/scan-organize';
import { SCAN_INTERVAL_SEC_OPTIONS } from '@/features/scan-settings';
import {
  FilterPresetsMenu,
  SEARCH_DEBOUNCE_MS,
  useFilterPresets,
  type ScanWorkbenchFilters,
  type SecurityFilterValue,
} from '@/features/scan-filters';
import {
  filterScanSearchHistoryForAutocomplete,
  useScanSearchHistory,
} from '@/features/scan-search';
import {
  rssiFilterSx,
  rssiSliderSx,
  scanAppBarSx,
  scanToolbarSx,
  searchFieldSx,
  vendorFieldSx,
} from './styles';
import { useScanIntl } from '@/shared/i18n';

export type ScanAppBarProps = {
  filters: ScanWorkbenchFilters;
  onFiltersChange: (next: ScanWorkbenchFilters) => void;
  onOpenColumnsPanel: () => void;
  onExportCsv: (scope: CsvExportScope) => void;
  exportSelectedDisabled?: boolean;
  searchInputRef?: RefObject<HTMLInputElement | null>;
  scanIntervalSec: number;
  onScanIntervalSecChange: (sec: number) => void;
  onOpenSettings: () => void;
  organizeBy: OrganizeByValue;
  onOrganizeByChange: (value: OrganizeByValue) => void;
};

export function ScanAppBar({
  filters,
  onFiltersChange,
  onOpenColumnsPanel,
  onExportCsv,
  exportSelectedDisabled = false,
  searchInputRef,
  scanIntervalSec,
  onScanIntervalSecChange,
  onOpenSettings,
  organizeBy,
  onOrganizeByChange,
}: ScanAppBarProps) {
  const { formatMessage } = useScanIntl();
  const [localSearch, setLocalSearch] = useState(filters.searchQuery);
  const [exportMenuEl, setExportMenuEl] = useState<null | HTMLElement>(null);
  const { history: searchHistory, recordCommit: recordSearchHistoryCommit } =
    useScanSearchHistory();
  const filterPresets = useFilterPresets({
    currentFilters: filters,
    onApplyFilters: onFiltersChange,
  });
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const exportMenuOpen = Boolean(exportMenuEl);
  const searchHistoryOptions = useMemo(
    () => filterScanSearchHistoryForAutocomplete(searchHistory, localSearch),
    [searchHistory, localSearch]
  );

  const closeExportMenu = () => setExportMenuEl(null);

  const exportScope = (scope: CsvExportScope) => {
    closeExportMenu();
    onExportCsv(scope);
  };

  useEffect(() => {
    setLocalSearch(filters.searchQuery);
  }, [filters.searchQuery]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (filtersRef.current.searchQuery === localSearch) {
        recordSearchHistoryCommit(localSearch);
        return;
      }
      onFiltersChange({ ...filtersRef.current, searchQuery: localSearch });
      recordSearchHistoryCommit(localSearch);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [localSearch, onFiltersChange, recordSearchHistoryCommit]);

  return (
    <AppBar color="transparent" elevation={0} position="static" sx={scanAppBarSx}>
      <Toolbar disableGutters sx={scanToolbarSx} variant="dense">
        <ToggleButtonGroup
          aria-label={formatMessage('scan.filter.band')}
          exclusive
          size="small"
          value={filters.band}
          onChange={(_, value) => {
            if (value) onFiltersChange({ ...filters, band: value });
          }}
        >
          <ToggleButton value="all">{formatMessage('scan.filter.band.all')}</ToggleButton>
          <ToggleButton value="24">{formatMessage('scan.filter.band.24')}</ToggleButton>
          <ToggleButton value="5">{formatMessage('scan.filter.band.5')}</ToggleButton>
          <ToggleButton value="6">{formatMessage('scan.filter.band.6')}</ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup
          aria-label={formatMessage('scan.filter.secure')}
          size="small"
          value={filters.security}
          onChange={(_, value: SecurityFilterValue[]) => {
            onFiltersChange({ ...filters, security: value });
          }}
        >
          <ToggleButton value="open">{formatMessage('scan.filter.open')}</ToggleButton>
          <ToggleButton value="secure">{formatMessage('scan.filter.secure')}</ToggleButton>
        </ToggleButtonGroup>

        <Autocomplete
          disableClearable
          freeSolo
          openOnFocus
          filterOptions={(options) => options}
          inputValue={localSearch}
          options={searchHistoryOptions}
          sx={searchFieldSx}
          onChange={(_, value) => {
            if (typeof value === 'string') setLocalSearch(value);
          }}
          onInputChange={(_, value, reason) => {
            if (reason === 'input' || reason === 'clear' || reason === 'reset') {
              setLocalSearch(value);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={searchInputRef}
              placeholder={formatMessage('scan.search.placeholder')}
              size="small"
              slotProps={{
                ...params.slotProps,
                input: {
                  ...params.slotProps.input,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <Search fontSize="small" />
                      </InputAdornment>
                      {params.slotProps.input.startAdornment}
                    </>
                  ),
                  endAdornment: localSearch ? (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={formatMessage('scan.search.clear')}
                        edge="end"
                        size="small"
                        onClick={() => setLocalSearch('')}
                      >
                        <Clear fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : (
                    params.slotProps.input.endAdornment
                  ),
                },
              }}
            />
          )}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            return (
              <li key={key} {...optionProps}>
                <History fontSize="small" sx={{ mr: 1, opacity: 0.6 }} />
                <Typography noWrap component="span" variant="body2">
                  {option}
                </Typography>
              </li>
            );
          }}
          slotProps={{
            listbox: { sx: { maxHeight: 240 } },
          }}
        />

        <TextField
          placeholder={formatMessage('scan.col.vendor')}
          size="small"
          sx={vendorFieldSx}
          value={filters.vendorQuery}
          onChange={(event) => onFiltersChange({ ...filters, vendorQuery: event.target.value })}
        />

        <FormControl size="small" sx={{ minWidth: 88 }}>
          <Select
            aria-label={formatMessage('scan.settings.scanInterval')}
            displayEmpty
            value={scanIntervalSec}
            onChange={(event) => onScanIntervalSecChange(Number(event.target.value))}
          >
            {SCAN_INTERVAL_SEC_OPTIONS.map((sec) => (
              <MenuItem key={sec} value={sec}>
                {formatMessage('scan.settings.scanIntervalSec', { sec })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            aria-label={formatMessage('scan.organizeBy.label')}
            value={organizeBy}
            onChange={(event) => onOrganizeByChange(event.target.value as OrganizeByValue)}
          >
            {(
              [
                ['none', 'scan.organizeBy.none'],
                ['ssid', 'scan.organizeBy.ssid'],
                ['ap', 'scan.organizeBy.ap'],
                ['vendor', 'scan.organizeBy.vendor'],
              ] as const
            ).map(([value, key]) => (
              <MenuItem key={value} value={value}>
                {formatMessage(key)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack direction="row" spacing={1} sx={rssiFilterSx}>
          <Typography color="text.secondary" variant="caption">
            {formatMessage('scan.filter.minRssi')}
          </Typography>
          <Slider
            max={-40}
            min={-95}
            size="small"
            step={1}
            sx={rssiSliderSx}
            value={filters.minRssiDbm ?? -95}
            valueLabelDisplay="auto"
            onChange={(_, value) => {
              const num = value as number;
              onFiltersChange({
                ...filters,
                minRssiDbm: num <= -95 ? null : num,
              });
            }}
          />
        </Stack>

        <FilterPresetsMenu presets={filterPresets} />

        <Tooltip title={formatMessage('scan.export.csv')}>
          <IconButton
            aria-controls={exportMenuOpen ? 'scan-export-menu' : undefined}
            aria-expanded={exportMenuOpen}
            aria-haspopup="true"
            aria-label={formatMessage('scan.export.csv')}
            onClick={(event) => setExportMenuEl(event.currentTarget)}
          >
            <FileDownload />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={exportMenuEl}
          id="scan-export-menu"
          open={exportMenuOpen}
          onClose={closeExportMenu}
        >
          <MenuItem onClick={() => exportScope('visible')}>
            {formatMessage('scan.export.visible')}
          </MenuItem>
          <MenuItem disabled={exportSelectedDisabled} onClick={() => exportScope('selected')}>
            {formatMessage('scan.export.selected')}
          </MenuItem>
          <MenuItem onClick={() => exportScope('all')}>{formatMessage('scan.export.all')}</MenuItem>
        </Menu>
        <Tooltip title={formatMessage('scan.settings.open')}>
          <IconButton aria-label={formatMessage('scan.settings.open')} onClick={onOpenSettings}>
            <Settings />
          </IconButton>
        </Tooltip>
        <Tooltip title={formatMessage('scan.columns.manage')}>
          <IconButton
            aria-label={formatMessage('scan.columns.manage')}
            onClick={onOpenColumnsPanel}
          >
            <ViewColumn />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
