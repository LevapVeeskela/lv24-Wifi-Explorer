import { Chip } from '@mui/material';
import type { ScanIssueId } from '@/features/scan-issues';
import { useScanIntl } from '@/shared/i18n';
import type { IssueFacet as IssueFacetItem } from './buildAutoFilterFacets';
import { FacetSection } from './FacetSection';
import { filterChipSx } from './styles';

export type IssuesFacetProps = {
  issues: readonly IssueFacetItem[];
  selectedIds: readonly ScanIssueId[];
  onToggle: (id: ScanIssueId) => void;
};

export function IssuesFacet({ issues, selectedIds, onToggle }: IssuesFacetProps) {
  const { formatMessage } = useScanIntl();

  return (
    <FacetSection title={formatMessage('scan.filterSidebar.section.issues')}>
      {issues.map(({ id, count }) => {
        const isSelected = selectedIds.includes(id);
        return (
          <Chip
            key={id}
            clickable
            color={isSelected ? 'primary' : 'default'}
            label={formatMessage('scan.filterSidebar.issueCount', {
              label: formatMessage(`scan.issue.${id}`),
              count,
            })}
            size="small"
            sx={filterChipSx}
            variant={isSelected ? 'filled' : 'outlined'}
            onClick={() => onToggle(id)}
          />
        );
      })}
    </FacetSection>
  );
}
