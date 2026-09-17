import Grid from '@mui/material/Grid';
import type { ObservedBss } from '@/domain/bss';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import type { ChartTimescale, SignalChartUnit } from '@/features/signal-history/types';
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
};

export function ChartStrip({
  selectedRow,
  allBss,
  chartUnit,
  onChartUnitChange,
  timescale,
  onTimescaleChange,
}: ChartStripProps) {
  const selectedChannel = selectedRow?.channel ?? null;
  const band = selectedRow?.band;
  const occupancyBand = band === 2.4 || band === 5 || band === 6 ? band : 5;

  return (
    <Grid columns={12} container spacing={1} sx={chartStripSx}>
      <Grid size={{ xs: 12, md: 4 }}>
        <SignalHistoryChart
          row={selectedRow}
          timescale={timescale}
          unit={chartUnit}
          onTimescaleChange={onTimescaleChange}
          onUnitChange={onChartUnitChange}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <SelectedChannelChart row={selectedRow} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <OccupancyChart
          band={occupancyBand}
          bssList={allBss}
          selectedBssid={selectedRow?.bssid ?? null}
          selectedChannel={selectedChannel}
          selectedColor={selectedRow?.seriesColor}
        />
      </Grid>
    </Grid>
  );
}
