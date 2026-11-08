import { useMemo } from 'react';
import { Box, Chip, List, ListItemButton, Stack, Typography } from '@mui/material';
import type { ScanGridRow } from '@/entities/bss';
import { scanIssueIdsFromMessageKeys } from '@/domain';
import type { IssueSeverity, ScanIssueId } from '@/domain';
import { buildIssueInspectorGroups, rowsWithIssues } from '@/features/issues';
import type { IssueInspectorRow } from '@/features/issues';
import { isSelectedRow } from '@/features/scan-selection';
import type { MessageKey } from '@/shared/i18n';
import { useScanIntl } from '@/shared/i18n';
import { useIssuesInspectorData } from './IssuesInspectorContext';
import {
  issueBssButtonSx,
  issueGroupHeaderSx,
  issueGroupSx,
  issueGroupTitleSx,
  issuesInspectorRootSx,
  issuesInspectorSummarySx,
} from './styles';

const SEVERITY_LABEL: Record<IssueSeverity, MessageKey> = {
  warning: 'scan.issues.severity.warning',
  info: 'scan.issues.severity.info',
};

const NO_ROWS: readonly ScanGridRow[] = [];

export type IssuesInspectorProps = {
  rows: readonly ScanGridRow[];
  /** Precomputed row id → issue ids; falls back to each row's `issueKeys`. */
  issueIdsByRowId?: ReadonlyMap<string, readonly ScanIssueId[]>;
  selectedBssid?: string | null;
  onSelectBssid?: (bssid: string) => void;
};

function toInspectorRow(
  row: ScanGridRow,
  issueIdsByRowId?: ReadonlyMap<string, readonly ScanIssueId[]>
): IssueInspectorRow {
  return {
    id: row.id,
    bssid: row.bssid,
    ssid: row.ssid,
    ssidHidden: row.ssidHidden,
    rssiDbm: row.rssiDbm,
    issueIds: issueIdsByRowId?.get(row.id) ?? scanIssueIdsFromMessageKeys(row.issueKeys),
  };
}

export function IssuesInspector({
  rows,
  issueIdsByRowId,
  selectedBssid,
  onSelectBssid,
}: IssuesInspectorProps) {
  const { formatMessage } = useScanIntl();
  const flaggedRows = useMemo(
    () => rowsWithIssues(rows.map((row) => toInspectorRow(row, issueIdsByRowId))),
    [rows, issueIdsByRowId]
  );
  const groups = useMemo(() => buildIssueInspectorGroups(flaggedRows), [flaggedRows]);

  if (groups.length === 0) {
    return (
      <Box sx={issuesInspectorRootSx}>
        <Typography color="text.secondary" variant="body2">
          {formatMessage('scan.issues.empty')}
        </Typography>
      </Box>
    );
  }

  const ssidLabel = (row: IssueInspectorRow) =>
    row.ssidHidden ? formatMessage('scan.ssid.hidden') : row.ssid.trim() || '—';

  return (
    <Box sx={issuesInspectorRootSx}>
      <Typography sx={issuesInspectorSummarySx} variant="caption">
        {formatMessage('scan.issues.count', { count: flaggedRows.length })}
      </Typography>
      {groups.map((group) => (
        <Box key={group.id} sx={issueGroupSx}>
          <Box sx={issueGroupHeaderSx}>
            <Chip
              color={group.severity}
              label={formatMessage(SEVERITY_LABEL[group.severity])}
              size="small"
              variant="outlined"
            />
            <Typography noWrap sx={issueGroupTitleSx} variant="body2">
              {formatMessage(group.i18nKey)}
            </Typography>
            <Chip label={group.rows.length} size="small" variant="outlined" />
          </Box>
          <List dense disablePadding>
            {group.rows.map((row) => (
              <ListItemButton
                key={row.id}
                selected={isSelectedRow(row.bssid, selectedBssid)}
                sx={issueBssButtonSx}
                onClick={onSelectBssid ? () => onSelectBssid(row.bssid) : undefined}
              >
                <Stack sx={{ minWidth: 0, width: '100%' }}>
                  <Typography noWrap variant="body2">
                    {ssidLabel(row)}
                  </Typography>
                  <Typography color="text.secondary" noWrap variant="caption">
                    {row.bssid} · {row.rssiDbm} dBm
                  </Typography>
                </Stack>
              </ListItemButton>
            ))}
          </List>
        </Box>
      ))}
    </Box>
  );
}

/** Dock adapter: reads the page-provided snapshot data from context. */
export function IssuesInspectorPanel() {
  const data = useIssuesInspectorData();
  return (
    <IssuesInspector
      issueIdsByRowId={data?.issueIdsByRowId}
      rows={data?.rows ?? NO_ROWS}
      selectedBssid={data?.selectedBssid}
      onSelectBssid={data?.onSelectBssid}
    />
  );
}
