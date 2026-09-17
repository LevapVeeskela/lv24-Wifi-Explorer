import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  AppBar,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import Search from '@mui/icons-material/Search';
import Clear from '@mui/icons-material/Clear';
import FileDownload from '@mui/icons-material/FileDownload';
import ViewColumn from '@mui/icons-material/ViewColumn';
import type { CsvExportScope } from '@/features/export';
import {
  SEARCH_DEBOUNCE_MS,
  type ScanWorkbenchFilters,
  type SecurityFilterValue,
} from '@/features/scan-filters';
import {
  rssiFilterSx,
  rssiSliderSx,
  scanAppBarSx,
  scanToolbarSx,
  searchFieldSx,
  vendorFieldSx,
} from './styles';
import { t } from './t';

export type ScanAppBarProps = {
  filters: ScanWorkbenchFilters;
  onFiltersChange: (next: ScanWorkbenchFilters) => void;
  onOpenColumnsPanel: () => void;
  onExportCsv: (scope: CsvExportScope) => void;
  exportSelectedDisabled?: boolean;
  searchInputRef?: RefObject<HTMLInputElement | null>;
};

export function ScanAppBar({
  filters,
  onFiltersChange,
  onOpenColumnsPanel,
  onExportCsv,
  exportSelectedDisabled = false,
  searchInputRef,
}: ScanAppBarProps) {
  const [localSearch, setLocalSearch] = useState(filters.searchQuery);
  const [exportMenuEl, setExportMenuEl] = useState<null | HTMLElement>(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const exportMenuOpen = Boolean(exportMenuEl);

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
      if (filtersRef.current.searchQuery === localSearch) return;
      onFiltersChange({ ...filtersRef.current, searchQuery: localSearch });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [localSearch, onFiltersChange]);

  return (
    <AppBar color="transparent" elevation={0} position="static" sx={scanAppBarSx}>
      <Toolbar disableGutters sx={scanToolbarSx} variant="dense">
        <ToggleButtonGroup
          aria-label={t('scan.filter.band')}
          exclusive
          size="small"
          value={filters.band}
          onChange={(_, value) => {
            if (value) onFiltersChange({ ...filters, band: value });
          }}
        >
          <ToggleButton value="all">{t('scan.filter.band.all')}</ToggleButton>
          <ToggleButton value="24">{t('scan.filter.band.24')}</ToggleButton>
          <ToggleButton value="5">{t('scan.filter.band.5')}</ToggleButton>
          <ToggleButton value="6">{t('scan.filter.band.6')}</ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup
          aria-label={t('scan.filter.secure')}
          size="small"
          value={filters.security}
          onChange={(_, value: SecurityFilterValue[]) => {
            onFiltersChange({ ...filters, security: value });
          }}
        >
          <ToggleButton value="open">{t('scan.filter.open')}</ToggleButton>
          <ToggleButton value="secure">{t('scan.filter.secure')}</ToggleButton>
        </ToggleButtonGroup>

        <TextField
          inputRef={searchInputRef}
          placeholder={t('scan.search.placeholder')}
          size="small"
          sx={searchFieldSx}
          value={localSearch}
          onChange={(event) => setLocalSearch(event.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: localSearch ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={t('scan.search.clear')}
                    edge="end"
                    size="small"
                    onClick={() => setLocalSearch('')}
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />

        <TextField
          placeholder={t('scan.col.vendor')}
          size="small"
          sx={vendorFieldSx}
          value={filters.vendorQuery}
          onChange={(event) => onFiltersChange({ ...filters, vendorQuery: event.target.value })}
        />

        <Stack direction="row" spacing={1} sx={rssiFilterSx}>
          <Typography color="text.secondary" variant="caption">
            {t('scan.filter.minRssi')}
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

        <Tooltip title={t('scan.export.csv')}>
          <IconButton
            aria-controls={exportMenuOpen ? 'scan-export-menu' : undefined}
            aria-expanded={exportMenuOpen}
            aria-haspopup="true"
            aria-label={t('scan.export.csv')}
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
          <MenuItem onClick={() => exportScope('visible')}>{t('scan.export.visible')}</MenuItem>
          <MenuItem disabled={exportSelectedDisabled} onClick={() => exportScope('selected')}>
            {t('scan.export.selected')}
          </MenuItem>
          <MenuItem onClick={() => exportScope('all')}>{t('scan.export.all')}</MenuItem>
        </Menu>
        <Tooltip title={t('scan.columns.manage')}>
          <IconButton aria-label={t('scan.columns.manage')} onClick={onOpenColumnsPanel}>
            <ViewColumn />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
