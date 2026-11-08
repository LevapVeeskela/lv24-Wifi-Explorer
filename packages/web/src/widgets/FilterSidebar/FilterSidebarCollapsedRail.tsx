import { Box, IconButton, Stack, Tooltip } from '@mui/material';
import ChevronRight from '@mui/icons-material/ChevronRight';
import FilterList from '@mui/icons-material/FilterList';
import { useScanIntl } from '@/shared/i18n';
import { filterSidebarRootSx } from './styles';

export type FilterSidebarCollapsedRailProps = {
  filtersActive: boolean;
  onExpand: () => void;
};

export function FilterSidebarCollapsedRail({
  filtersActive,
  onExpand,
}: FilterSidebarCollapsedRailProps) {
  const { formatMessage } = useScanIntl();

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
            onClick={onExpand}
          >
            <ChevronRight fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={formatMessage('scan.filterSidebar.title')}>
          <FilterList aria-hidden color={filtersActive ? 'primary' : 'action'} fontSize="small" />
        </Tooltip>
      </Stack>
    </Box>
  );
}
