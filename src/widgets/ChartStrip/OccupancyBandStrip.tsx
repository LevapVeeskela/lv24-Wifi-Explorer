import Grid from '@mui/material/Grid';
import type { ObservedBss } from '@/domain/bss';
import type { BandGhz } from '@/domain/channel';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import { OccupancyChart } from './OccupancyChart';
import { occupancyStripSx } from './styles';

export type OccupancyBandStripProps = {
  bssList: readonly ObservedBss[];
  selectedRow: ScanGridRow | null;
  height?: number;
};

const BANDS: readonly BandGhz[] = [2.4, 5, 6];

export function OccupancyBandStrip({
  bssList,
  selectedRow,
  height = 280,
}: OccupancyBandStripProps) {
  return (
    <Grid columns={12} container spacing={1} sx={occupancyStripSx}>
      {BANDS.map((band) => (
        <Grid key={band} size={{ xs: 12, md: 4 }}>
          <OccupancyChart
            band={band}
            bssList={bssList}
            height={height}
            selectedBssid={selectedRow?.band === band ? selectedRow.bssid : null}
            selectedChannel={selectedRow?.band === band ? selectedRow.channel : null}
            selectedColor={selectedRow?.band === band ? selectedRow.seriesColor : undefined}
          />
        </Grid>
      ))}
    </Grid>
  );
}
