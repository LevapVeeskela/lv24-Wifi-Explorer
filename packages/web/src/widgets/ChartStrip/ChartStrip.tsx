import Grid from '@mui/material/Grid';
import type { ObservedBss } from '@/domain/bss';
import type { ScanGridRow } from '@/entities/bss';
import { pickOccupancyBand, visibleOccupancyBands } from '@/entities/channel';
import type { GraphLabelMode } from '@/features/scan-settings';
import type { ChartTimescale, SignalChartUnit } from '@/entities/signal';
import { OccupancyChart } from './OccupancyChart';
import { SelectedChannelChart } from './SelectedChannelChart';
import { SignalHistoryChart } from './SignalHistoryChart';
import { chartStripSx } from './styles';

export type ChartStripProps = {
  selectedRow: ScanGridRow | null;
  allBss: readonly ObservedBss[];
  chartUnit: SignalChartUnit;
  onChartUnitChange: (unit: SignalChartUnit) => void;
  timescale: ChartTimescale;
  onTimescaleChange?: (timescale: ChartTimescale) => void;
  hideEmptyBands?: boolean;
  graphLabelMode?: GraphLabelMode;
};

export function ChartStrip({
  selectedRow,
  allBss,
  chartUnit,
  onChartUnitChange,
  timescale,
  onTimescaleChange,
  hideEmptyBands = false,
  graphLabelMode = 'ssid',
}: ChartStripProps) {
  const selectedChannel = selectedRow?.channel ?? null;
  const rowBand =
    selectedRow?.band === 2.4 || selectedRow?.band === 5 || selectedRow?.band === 6
      ? selectedRow.band
      : null;
  const visibleBands = visibleOccupancyBands(allBss, hideEmptyBands);
  const occupancyBand = pickOccupancyBand(rowBand, visibleBands);
  const showOccupancy = !hideEmptyBands || visibleBands.includes(occupancyBand);
  const chartColumn = showOccupancy ? 4 : 6;

  return (
    <Grid columns={12} container spacing={1} sx={chartStripSx}>
      <Grid size={{ xs: 12, md: chartColumn }}>
        <SignalHistoryChart
          graphLabelMode={graphLabelMode}
          row={selectedRow}
          timescale={timescale}
          unit={chartUnit}
          onTimescaleChange={onTimescaleChange}
          onUnitChange={onChartUnitChange}
        />
      </Grid>
      <Grid size={{ xs: 12, md: chartColumn }}>
        <SelectedChannelChart graphLabelMode={graphLabelMode} row={selectedRow} />
      </Grid>
      {showOccupancy ? (
        <Grid size={{ xs: 12, md: 4 }}>
          <OccupancyChart
            band={occupancyBand}
            bssList={allBss}
            selectedBssid={selectedRow?.bssid ?? null}
            selectedChannel={selectedChannel}
            selectedColor={selectedRow?.seriesColor}
          />
        </Grid>
      ) : null}
    </Grid>
  );
}
