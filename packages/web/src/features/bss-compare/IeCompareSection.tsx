import { useMemo, useState } from 'react';
import {
  Box,
  FormControlLabel,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { ScanGridRow } from '@/entities/bss';
import type { FormatMessageFn } from '@/shared/i18n';
import { buildIeDiff, type IeDiffCell, type IeDiffEntry } from './buildIeDiff';
import {
  compareDiffCellSx,
  compareHintSx,
  compareIeHeadSx,
  compareIeSectionSx,
  compareLabelCellSx,
  compareValueMonoSx,
} from './styles';

export type IeCompareSectionProps = {
  /** Exactly the two BSS compared for IE bytes. */
  left: ScanGridRow;
  right: ScanGridRow;
  formatMessage: FormatMessageFn;
};

function SideCell({
  cell,
  entry,
  otherBssid,
  formatMessage,
}: {
  cell: IeDiffCell | null;
  entry: IeDiffEntry;
  otherBssid: string;
  formatMessage: FormatMessageFn;
}) {
  const sx = entry.differs ? compareDiffCellSx : undefined;
  if (cell == null) {
    return (
      <TableCell sx={sx}>
        <Typography variant="caption" color="text.secondary">
          {formatMessage('scan.compare.presentOnlyIn', { bssid: otherBssid })}
        </Typography>
      </TableCell>
    );
  }
  return (
    <TableCell sx={sx}>
      <Stack spacing={0.25}>
        <Typography sx={compareValueMonoSx} variant="body2">
          {formatMessage('scan.adv.bytes', { count: cell.length })}
        </Typography>
        <Typography sx={compareValueMonoSx} variant="caption" color="text.secondary">
          {cell.hex}
        </Typography>
      </Stack>
    </TableCell>
  );
}

export function IeCompareSection({ left, right, formatMessage }: IeCompareSectionProps) {
  const [hideIdentical, setHideIdentical] = useState(true);

  const diff = useMemo(
    () =>
      buildIeDiff(
        { bytes: left.source.lastRaw.informationElementData },
        { bytes: right.source.lastRaw.informationElementData }
      ),
    [left, right]
  );

  const rows = hideIdentical ? diff.entries.filter((entry) => entry.differs) : diff.entries;

  return (
    <Box sx={compareIeSectionSx}>
      <Stack direction="row" spacing={1} sx={compareIeHeadSx}>
        <Typography variant="subtitle2">{formatMessage('scan.compare.ies')}</Typography>
        <Typography variant="caption" color="text.secondary">
          {formatMessage('scan.compare.ieCount', { count: diff.comparedCount })}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <FormControlLabel
          control={
            <Switch
              checked={hideIdentical}
              onChange={(event) => setHideIdentical(event.target.checked)}
              size="small"
            />
          }
          label={
            <Typography variant="caption">{formatMessage('scan.compare.hideIdentical')}</Typography>
          }
          sx={{ mr: 0 }}
        />
      </Stack>
      {!diff.hasData ? (
        <Typography sx={compareHintSx} variant="body2">
          {formatMessage('scan.field.unavailable')}
        </Typography>
      ) : rows.length === 0 ? (
        <Typography sx={compareHintSx} variant="body2">
          {formatMessage('scan.compare.iesIdentical')}
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={compareLabelCellSx}>{formatMessage('scan.compare.field')}</TableCell>
                <TableCell>
                  <Typography sx={compareValueMonoSx} variant="body2">
                    {left.bssid}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={compareValueMonoSx} variant="body2">
                    {right.bssid}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((entry) => (
                <TableRow key={entry.key}>
                  <TableCell component="th" scope="row" sx={compareLabelCellSx}>
                    {entry.name}
                  </TableCell>
                  <SideCell
                    cell={entry.left}
                    entry={entry}
                    formatMessage={formatMessage}
                    otherBssid={right.bssid}
                  />
                  <SideCell
                    cell={entry.right}
                    entry={entry}
                    formatMessage={formatMessage}
                    otherBssid={left.bssid}
                  />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
