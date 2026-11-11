import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import type { ScanGridRow } from '@/entities/bss';
import { graphLabelForRow } from '@/features/scan-settings';
import type { GraphLabelMode } from '@/features/scan-settings';
import { buildMetricSeries, buildSignalSeries, type SignalSeriesPoint } from '@/entities/signal';
import { signalTraceLabel, type SignalTraceKind } from '@/shared/i18n';
import { formatMetricValue, metricAxis } from '@/entities/signal';
import { buildAverageSeries, buildMaxSeries, DEFAULT_ROLLING_WINDOW } from '@/entities/signal';
import { seriesStats } from '@/entities/signal';
import { stepTimescale, TIMESCALE_MS } from '@/entities/signal';
import {
  METRIC_ORDER,
  TIMESCALE_ORDER,
  type ChartTimescale,
  type SignalChartMetric,
  type SignalChartUnit,
} from '@/entities/signal';
import { createFormatMessage } from '@/shared/i18n';
import { useScanIntl } from '@/shared/i18n';
import { ChartA11yTable } from './ChartA11yTable';
import {
  chartCaptionSx,
  chartEmptySx,
  chartHeaderSx,
  chartPaperSx,
  chartStatsSx,
  chartTitleSx,
  chartToolbarSx,
  signalChartAverageColor,
  signalChartMaxColor,
  signalChartTracesSx,
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

const METRIC_MESSAGE_KEYS = {
  rssi: 'scan.chart.metric.rssi',
  snr: 'scan.chart.metric.snr',
  noise: 'scan.chart.metric.noise',
} as const satisfies Record<SignalChartMetric, string>;

const TRACE_ORDER: readonly SignalTraceKind[] = ['live', 'average', 'max'];
const ROLLING_WINDOW = DEFAULT_ROLLING_WINDOW;

function statsSummary(points: readonly SignalSeriesPoint[], unit: 'pct' | 'dbm' | 'db'): string {
  const stats = seriesStats(points);
  if (!stats) return 'min — · avg — · max —';
  return [
    `min ${formatMetricValue(unit, stats.min)}`,
    `avg ${formatMetricValue(unit, stats.avg)}`,
    `max ${formatMetricValue(unit, stats.max)}`,
  ].join(' · ');
}

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
  const [metric, setMetric] = useState<SignalChartMetric>('rssi');
  const [traces, setTraces] = useState<Record<SignalTraceKind, boolean>>({
    live: true,
    average: false,
    max: false,
  });
  const [sampleIndex, setSampleIndex] = useState(0);

  useEffect(() => {
    setLocalTimescale(timescaleProp);
  }, [timescaleProp]);

  const timescale = onTimescaleChange ? timescaleProp : localTimescale;
  const setTimescale = onTimescaleChange ?? setLocalTimescale;
  const color = row?.seriesColor ?? '#FB6E4A';
  const axis = metricAxis(metric, unit);
  const source = row?.source ?? null;
  const series = useMemo(
    () =>
      metric === 'rssi'
        ? buildSignalSeries(source, unit, { timescale })
        : buildMetricSeries(source, metric, { timescale }),
    [source, metric, unit, timescale]
  );

  const averageSeries = useMemo(() => buildAverageSeries(series, ROLLING_WINDOW), [series]);
  const maxSeries = useMemo(() => buildMaxSeries(series, ROLLING_WINDOW), [series]);

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
  const tableRows = series.slice(-TABLE_POINTS).map((point, index) => {
    const offset = series.length - Math.min(TABLE_POINTS, series.length) + index;
    const parts = [`live ${formatMetricValue(axis.unit, point.y)}`];
    if (traces.average)
      parts.push(`avg ${formatMetricValue(axis.unit, averageSeries[offset]?.y ?? Number.NaN)}`);
    if (traces.max)
      parts.push(`max ${formatMetricValue(axis.unit, maxSeries[offset]?.y ?? Number.NaN)}`);
    return { x: point.x.toISOString(), y: parts.join(' · ') };
  });
  const yLabel =
    metric === 'rssi'
      ? unit === 'dbm'
        ? formatMessage('scan.chart.unit.dbm')
        : formatMessage('scan.chart.unit.pct')
      : formatMessage(METRIC_MESSAGE_KEYS[metric]);

  return (
    <Paper
      aria-label={formatMessage('scan.chart.signal')}
      sx={chartPaperSx}
      tabIndex={0}
      variant="outlined"
      onKeyDown={onKeyDown}
    >
      <Stack direction="row" sx={chartHeaderSx}>
        <Typography sx={chartTitleSx} variant="subtitle2">
          {formatMessage('scan.chart.signal')}
        </Typography>
        <Stack direction="row" sx={chartToolbarSx}>
          <ToggleButtonGroup
            aria-label={formatMessage('scan.chart.metric')}
            exclusive
            size="small"
            value={metric}
            onChange={(_, value: SignalChartMetric | null) => value && setMetric(value)}
          >
            {METRIC_ORDER.map((id) => (
              <ToggleButton key={id} value={id}>
                {formatMessage(METRIC_MESSAGE_KEYS[id])}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          {metric === 'rssi' ? (
            <ToggleButtonGroup
              exclusive
              size="small"
              value={unit}
              onChange={(_, value: SignalChartUnit | null) => value && onUnitChange(value)}
            >
              <ToggleButton value="pct">{formatMessage('scan.chart.unit.pct')}</ToggleButton>
              <ToggleButton value="dbm">{formatMessage('scan.chart.unit.dbm')}</ToggleButton>
            </ToggleButtonGroup>
          ) : null}
        </Stack>
      </Stack>
      <Stack direction="row" sx={signalChartTracesSx}>
        <ToggleButtonGroup
          aria-label="Trace visibility"
          size="small"
          value={TRACE_ORDER.filter((kind) => traces[kind])}
          onChange={(_, value: SignalTraceKind[]) => {
            const next = { live: false, average: false, max: false };
            for (const kind of value) next[kind] = true;
            if (!next.live && !next.average && !next.max) next.live = true;
            setTraces(next);
          }}
        >
          {TRACE_ORDER.map((kind) => (
            <ToggleButton key={kind} value={kind}>
              {signalTraceLabel(locale, kind)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
      <Stack direction="row" sx={chartToolbarSx}>
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
      </Stack>
      {series.length === 0 ? (
        <Typography sx={chartEmptySx} variant="caption">
          {formatMessage('scan.chart.empty')}
        </Typography>
      ) : (
        <LineChart
          height={Math.max(80, height - 88)}
          margin={{ top: 8, right: 8, bottom: 24, left: 40 }}
          series={[
            ...(traces.live
              ? [
                  {
                    data: series.map((point) => point.y),
                    color,
                    showMark: false,
                    label: seriesLabel,
                  },
                ]
              : []),
            ...(traces.average
              ? [
                  {
                    data: averageSeries.map((point) => point.y),
                    color: signalChartAverageColor,
                    showMark: false,
                    label: `${seriesLabel} · average`,
                  },
                ]
              : []),
            ...(traces.max
              ? [
                  {
                    data: maxSeries.map((point) => point.y),
                    color: signalChartMaxColor,
                    showMark: false,
                    label: `${seriesLabel} · max`,
                  },
                ]
              : []),
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
              min: axis.min,
              max: axis.max,
            },
          ]}
        />
      )}
      <Typography sx={chartCaptionSx} variant="caption">
        {formatMessage('scan.chart.timescale')}: {timescale}
      </Typography>
      <Typography sx={chartStatsSx} variant="caption">
        {statsSummary(series, axis.unit)}
      </Typography>
      <ChartA11yTable
        activeIndex={sampleIndex}
        caption={formatMessage('scan.chart.table')}
        labelX={formatMessage('scan.chart.timescale')}
        labelY={yLabel}
        rows={tableRows}
      />
    </Paper>
  );
}
