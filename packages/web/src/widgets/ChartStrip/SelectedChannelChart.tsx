import { useMemo } from 'react';
import { Paper, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import type { ScanGridRow } from '@/entities/bss';
import { graphLabelForRow } from '@/features/scan-settings';
import type { GraphLabelMode } from '@/features/scan-settings';
import { createFormatMessage } from '@/shared/i18n';
import { useScanIntl } from '@/shared/i18n';
import { ChartA11yTable } from './ChartA11yTable';
import { chartCaptionSx, chartEmptySx, chartPaperSx } from './styles';

export type SelectedChannelChartProps = {
  row: ScanGridRow | null;
  height?: number;
  graphLabelMode?: GraphLabelMode;
};

export function SelectedChannelChart({
  row,
  height = 160,
  graphLabelMode = 'ssid',
}: SelectedChannelChartProps) {
  const { locale } = useScanIntl();
  const formatMessage = useMemo(() => createFormatMessage(locale), [locale]);
  const label = graphLabelForRow(row, graphLabelMode, formatMessage('scan.ssid.hidden'));

  return (
    <Paper aria-label={formatMessage('scan.chart.selected')} sx={chartPaperSx} variant="outlined">
      <Typography variant="subtitle2">{formatMessage('scan.chart.selected')}</Typography>
      {!row ? (
        <Typography sx={chartEmptySx} variant="caption">
          {formatMessage('scan.details.empty')}
        </Typography>
      ) : (
        <BarChart
          height={Math.max(80, height - 48)}
          hideLegend
          margin={{ top: 8, right: 8, bottom: 24, left: 36 }}
          series={[
            {
              data: [row.signalBarPct],
              color: row.seriesColor,
              label: label,
            },
          ]}
          skipAnimation
          xAxis={[
            {
              data: [label],
              scaleType: 'band',
            },
          ]}
          yAxis={[{ min: 0, max: 100 }]}
        />
      )}
      {row ? (
        <Typography sx={chartCaptionSx} variant="caption">
          {formatMessage('scan.details.channel')} {row.channel}
        </Typography>
      ) : null}
      {row ? (
        <ChartA11yTable
          activeIndex={0}
          caption={formatMessage('scan.chart.table')}
          labelX={formatMessage('scan.chart.selected')}
          labelY={formatMessage('scan.chart.unit.pct')}
          rows={[{ x: label, y: `${row.signalBarPct}%` }]}
        />
      ) : null}
    </Paper>
  );
}
