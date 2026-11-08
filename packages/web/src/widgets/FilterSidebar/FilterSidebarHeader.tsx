import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import FilterAltOff from '@mui/icons-material/FilterAltOff';
import { useScanIntl } from '@/shared/i18n';
import { filterSidebarHeaderSx } from './styles';

export type FilterSidebarHeaderProps = {
  filtersActive: boolean;
  onClear: () => void;
  onCollapse: () => void;
};

export function FilterSidebarHeader({
  filtersActive,
  onClear,
  onCollapse,
}: FilterSidebarHeaderProps) {
  const { formatMessage } = useScanIntl();

  return (
    <Box sx={filterSidebarHeaderSx}>
      <Typography component="h2" noWrap variant="subtitle2">
        {formatMessage('scan.filterSidebar.title')}
      </Typography>
      <Stack direction="row" spacing={0.25}>
        {filtersActive ? (
          <Tooltip title={formatMessage('scan.filterSidebar.clear')}>
            <IconButton
              aria-label={formatMessage('scan.filterSidebar.clear')}
              size="small"
              onClick={onClear}
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
            onClick={onCollapse}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}
