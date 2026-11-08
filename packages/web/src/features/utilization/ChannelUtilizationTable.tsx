import { useMemo } from 'react';
import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { ObservedBss } from '@/domain/bss';
import { formatDbm } from '@/entities/bss/formatters';
import { useScanIntl } from '@/shared/i18n/ScanIntlProvider';
import {
  computeUtilization,
  type ChannelUtilization,
  type UtilizationReport,
} from './computeUtilization';
import { createUtilizationFormatMessage } from './i18n/messages';

export type ChannelUtilizationTableProps = {
  bssList: readonly ObservedBss[];
  /** Override the assumed beacon frame size, bytes. */
  beaconBytes?: number;
  /** Max table body height, px (scrolls beyond). */
  maxHeight?: number;
  report?: UtilizationReport;
};

export type ChannelUtilizationTableRow = ChannelUtilization;

function percentFormatter(locale: string) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function ChannelUtilizationTable({
  bssList,
  beaconBytes,
  maxHeight = 240,
  report,
}: ChannelUtilizationTableProps) {
  const { locale } = useScanIntl();
  const t = useMemo(() => createUtilizationFormatMessage(locale), [locale]);
  const formatPercent = useMemo(() => percentFormatter(locale), [locale]);
  const computed = useMemo(
    () => report ?? computeUtilization(bssList, { beaconBytes }),
    [report, bssList, beaconBytes]
  );

  if (computed.channels.length === 0) {
    return (
      <Paper sx={{ p: 1, borderRadius: 0 }} variant="outlined">
        <Typography color="text.secondary" variant="caption">
          {t('utilization.empty')}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper aria-label={t('utilization.title')} sx={{ borderRadius: 0 }} variant="outlined">
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
        <Typography variant="subtitle2">{t('utilization.title')}</Typography>
        <Typography color="text.secondary" variant="caption">
          {t('utilization.estimatePrefix')}
        </Typography>
      </Stack>
      <TableContainer sx={{ maxHeight }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell align="right">{t('utilization.column.channel')}</TableCell>
              <TableCell>{t('utilization.column.band')}</TableCell>
              <TableCell align="right">{t('utilization.column.networks')}</TableCell>
              <TableCell align="right">{t('utilization.column.overlapping')}</TableCell>
              <TableCell align="right">{t('utilization.column.avgRssi')}</TableCell>
              <TableCell align="right">{t('utilization.column.beacon')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {computed.channels.map((row) => (
              <TableRow key={`${row.band}:${row.channel}`} hover>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {row.channel}
                </TableCell>
                <TableCell>{t('utilization.band', { band: row.band })}</TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {row.networkCount}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {row.overlappingBssCount}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatDbm(row.averageRssiDbm)}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {`~${formatPercent.format(row.beacon.beaconAirtimePct)}%`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography
        color="text.secondary"
        sx={{ display: 'block', px: 1, py: 0.5 }}
        variant="caption"
      >
        {t('utilization.caption.estimate')}
      </Typography>
    </Paper>
  );
}
