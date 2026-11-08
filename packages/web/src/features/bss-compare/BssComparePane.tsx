import { useMemo } from 'react';
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import type { ScanGridRow } from '@/entities/bss';
import { ssidGridLabel } from '@/entities/bss';
import { createFormatMessage } from '@/shared/i18n';
import { useScanIntl } from '@/shared/i18n';
import { buildCompareFieldRows } from './buildCompareFields';
import { MIN_BSS_COMPARE_COUNT } from './constants';
import { IeCompareSection } from './IeCompareSection';
import {
  compareDiffCellSx,
  compareHeaderSwatchSx,
  compareHintSx,
  compareLabelCellSx,
  comparePaneRootSx,
  compareTableWrapSx,
  compareValueMonoSx,
} from './styles';

export type BssComparePaneProps = {
  rows: readonly ScanGridRow[];
};

export function BssComparePane({ rows }: BssComparePaneProps) {
  const { locale } = useScanIntl();
  const formatMessage = useMemo(() => createFormatMessage(locale), [locale]);
  const hiddenSsid = formatMessage('scan.ssid.hidden');
  const unavailable = formatMessage('scan.field.unavailable');

  const fieldRows = useMemo(
    () => buildCompareFieldRows(rows, formatMessage, hiddenSsid, unavailable),
    [formatMessage, hiddenSsid, rows, unavailable]
  );

  if (rows.length < MIN_BSS_COMPARE_COUNT) {
    return (
      <Typography sx={compareHintSx} variant="body2">
        {formatMessage('scan.compare.hint')}
      </Typography>
    );
  }

  return (
    <Box sx={comparePaneRootSx}>
      <Typography sx={{ px: 2, pt: 1 }} variant="caption" color="text.secondary">
        {formatMessage('scan.compare.diffLegend')}
      </Typography>
      <Box sx={compareTableWrapSx}>
        <TableContainer>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={compareLabelCellSx}>{formatMessage('scan.compare.field')}</TableCell>
                {rows.map((row) => {
                  const title = ssidGridLabel(row, hiddenSsid);
                  return (
                    <TableCell key={row.id} align="left">
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'flex-start' }}>
                        <Box sx={compareHeaderSwatchSx(row.seriesColor)} aria-hidden />
                        <Stack spacing={0.25}>
                          <Typography sx={{ fontWeight: 600 }} variant="body2">
                            {title}
                          </Typography>
                          <Typography
                            sx={compareValueMonoSx}
                            variant="caption"
                            color="text.secondary"
                          >
                            {row.bssid}
                          </Typography>
                        </Stack>
                      </Stack>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {fieldRows.map((field) => (
                <TableRow key={field.id}>
                  <TableCell component="th" scope="row" sx={compareLabelCellSx}>
                    {formatMessage(field.labelKey)}
                  </TableCell>
                  {field.cells.map((cell, index) => {
                    const row = rows[index]!;
                    const valueNode = (
                      <Typography
                        sx={field.id === 'bssid' ? compareValueMonoSx : undefined}
                        variant="body2"
                      >
                        {cell.value}
                      </Typography>
                    );
                    return (
                      <TableCell
                        key={`${field.id}-${row.id}`}
                        sx={field.differs ? compareDiffCellSx : undefined}
                      >
                        {cell.unavailable ? (
                          <Tooltip title={unavailable}>{valueNode}</Tooltip>
                        ) : (
                          valueNode
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <IeCompareSection formatMessage={formatMessage} left={rows[0]!} right={rows[1]!} />
      </Box>
    </Box>
  );
}
