import { useMemo } from 'react';
import { Paper, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import type { ObservedBss } from '@/domain/bss';
import type { BandGhz } from '@/domain/channel';
import { computeBandOccupancy } from '@/features/channel-occupancy/computeOccupancy';
import { createFormatMessage } from '@/shared/i18n';
import { useScanIntl } from '@/shared/i18n/ScanIntlProvider';
import { ChartA11yTable } from './ChartA11yTable';
import { chartCaptionSx, chartPaperSx } from './styles';

export type OccupancyChartProps = {
  bssList: readonly ObservedBss[];
  band: BandGhz;
  selectedChannel: number | null;
  selectedBssid?: string | null;
  selectedColor?: string;
  height?: number;
  /** When false, title omits band (band is shown on strip tabs). */
  showBandInTitle?: boolean;
};

const OTHERS_COLOR = '#8A8178';

export function OccupancyChart({
  bssList,
  band,
  selectedChannel,
  selectedBssid = null,
  selectedColor = '#FB6E4A',
  height = 160,
  showBandInTitle = true,
}: OccupancyChartProps) {
  const { locale } = useScanIntl();
  const formatMessage = useMemo(() => createFormatMessage(locale), [locale]);
  const bars = useMemo(
    () => computeBandOccupancy(bssList, band, selectedChannel, selectedBssid),
    [bssList, band, selectedChannel, selectedBssid]
  );

  const tickEvery = band === 6 ? 8 : band === 5 ? 2 : 1;
  const title = showBandInTitle
    ? `${band} GHz · ${formatMessage('scan.chart.occupancy')}`
    : formatMessage('scan.chart.occupancy');

  return (
    <Paper aria-label={formatMessage('scan.chart.occupancy')} sx={chartPaperSx} variant="outlined">
      <Typography variant="subtitle2">{title}</Typography>
      <BarChart
        height={Math.max(80, height - 56)}
        hideLegend
        margin={{ top: 8, right: 8, bottom: band === 6 ? 28 : 24, left: 36 }}
        series={[
          {
            data: bars.map((bar) => bar.others),
            color: OTHERS_COLOR,
            stack: 'occ',
            label: formatMessage('scan.chart.occupancy'),
          },
          {
            data: bars.map((bar) => bar.selected),
            color: selectedColor,
            stack: 'occ',
            label: formatMessage('scan.chart.selected'),
          },
        ]}
        skipAnimation
        xAxis={[
          {
            data: bars.map((bar) => bar.channel),
            scaleType: 'band',
            tickLabelInterval: (_value, index) => index % tickEvery === 0,
          },
        ]}
        yAxis={[{ min: 0, max: 100 }]}
      />
      <Typography sx={chartCaptionSx} variant="caption">
        {formatMessage('scan.chart.occupancy.hint')}
      </Typography>
      <ChartA11yTable
        activeIndex={Math.max(
          0,
          bars.findIndex((bar) => bar.selectedHighlight)
        )}
        caption={formatMessage('scan.chart.table')}
        labelX={formatMessage('scan.details.channel')}
        labelY={formatMessage('scan.chart.occupancy')}
        rows={bars
          .filter((bar) => bar.score > 0 || bar.selectedHighlight)
          .map((bar) => ({
            x: String(bar.channel),
            y: String(bar.score),
          }))}
      />
    </Paper>
  );
}
