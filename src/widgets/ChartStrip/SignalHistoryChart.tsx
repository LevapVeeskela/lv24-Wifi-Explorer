import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import { graphLabelForRow } from '@/features/scan-settings/graphLabelForRow';
import type { GraphLabelMode } from '@/features/scan-settings/types';
import { buildSignalSeries } from '@/features/signal-history/buildSignalSeries';
import { stepTimescale, TIMESCALE_MS } from '@/features/signal-history/timescale';
import { TIMESCALE_ORDER, type ChartTimescale, type SignalChartUnit } from '@/features/signal-history/types';
import { createFormatMessage } from '@/shared/i18n';
import { useScanIntl } from '@/shared/i18n/ScanIntlProvider';
import { ChartA11yTable } from './ChartA11yTable';
import {
  chartCaptionSx,
  chartEmptySx,
  chartHeaderSx,
  chartPaperSx,
  chartToolbarSx,
} from './styles';

export type SignalHistoryChartProps = {
  row: ScanGridRow | null;
  unit: SignalChartUnit;
  onUnitChange: (unit: SignalChartUnit) => void;
  timescale: ChartTimescale;
  onTimescaleChange?: (timescale: ChartTimescale) => void;
  height?: number;
  graphLabelMode?: GraphLabelMode;
};

const TABLE_POINTS = 24;

export function SignalHistoryChart({
  row,
  unit,
  onUnitChange,
  timescale: timescaleProp,
  onTimescaleChange,
  height = 160,
  graphLabelMode = 'ssid',
}: SignalHistoryChartProps) {
  const { locale } = useScanIntl();
  const formatMessage = useMemo(() => createFormatMessage(locale), [locale]);
  const seriesLabel =
    graphLabelForRow(row, graphLabelMode, formatMessage('scan.ssid.hidden')) ||
    formatMessage('scan.chart.signal');
  const [localTimescale, setLocalTimescale] = useState(timescaleProp);
  const [sampleIndex, setSampleIndex] = useState(0);

  useEffect(() => {
    setLocalTimescale(timescaleProp);
  }, [timescaleProp]);

  const timescale = onTimescaleChange ? timescaleProp : localTimescale;
  const setTimescale = onTimescaleChange ?? setLocalTimescale;
  const color = row?.seriesColor ?? '#FB6E4A';
  const series = useMemo(
    () => buildSignalSeries(row?.source ?? null, unit, { timescale }),
    [row, unit, timescale]
  );

  useEffect(() => {
    setSampleIndex(Math.max(0, series.length - 1));
  }, [series]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setTimescale(stepTimescale(timescale, 1));
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setTimescale(stepTimescale(timescale, -1));
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setSampleIndex((index) => Math.max(0, index - 1));
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setSampleIndex((index) => Math.min(Math.max(0, series.length - 1), index + 1));
    }
  };

  const now = Date.now();
  const xMin = now - TIMESCALE_MS[timescale];
  const tableRows = series.slice(-TABLE_POINTS).map((point) => ({
    x: point.x.toISOString(),
    y: unit === 'dbm' ? `${point.y} dBm` : `${point.y}%`,
  }));

  return (
    <Paper
      aria-label={formatMessage('scan.chart.signal')}
      sx={chartPaperSx}
      tabIndex={0}
      variant="outlined"
      onKeyDown={onKeyDown}
    >
      <Stack direction="row" sx={chartHeaderSx}>
        <Typography variant="subtitle2">{formatMessage('scan.chart.signal')}</Typography>
        <Stack direction="row" sx={chartToolbarSx}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={unit}
            onChange={(_, value: SignalChartUnit | null) => value && onUnitChange(value)}
          >
            <ToggleButton value="pct">{formatMessage('scan.chart.unit.pct')}</ToggleButton>
            <ToggleButton value="dbm">{formatMessage('scan.chart.unit.dbm')}</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>
      <ToggleButtonGroup
        aria-label={formatMessage('scan.chart.timescale')}
        exclusive
        size="small"
        value={timescale}
        onChange={(_, value: ChartTimescale | null) => value && setTimescale(value)}
      >
        {TIMESCALE_ORDER.map((id) => (
          <ToggleButton key={id} value={id}>
            {id}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {series.length === 0 ? (
        <Typography sx={chartEmptySx} variant="caption">
          {formatMessage('scan.chart.empty')}
        </Typography>
      ) : (
        <LineChart
          height={Math.max(80, height - 88)}
          hideLegend
          margin={{ top: 8, right: 8, bottom: 24, left: 40 }}
          series={[
            {
              data: series.map((point) => point.y),
              color,
              showMark: false,
              label: seriesLabel,
            },
          ]}
          skipAnimation
          xAxis={[
            {
              data: series.map((point) => point.x),
              scaleType: 'time',
              min: xMin,
              max: now,
            },
          ]}
          yAxis={[
            {
              min: unit === 'dbm' ? -100 : 0,
              max: unit === 'dbm' ? 0 : 100,
            },
          ]}
        />
      )}
      <Typography sx={chartCaptionSx} variant="caption">
        {formatMessage('scan.chart.timescale')}: {timescale}
      </Typography>
      <ChartA11yTable
        activeIndex={sampleIndex}
        caption={formatMessage('scan.chart.table')}
        labelX={formatMessage('scan.chart.timescale')}
        labelY={unit === 'dbm' ? formatMessage('scan.chart.unit.dbm') : formatMessage('scan.chart.unit.pct')}
        rows={tableRows}
      />
    </Paper>
  );
}
