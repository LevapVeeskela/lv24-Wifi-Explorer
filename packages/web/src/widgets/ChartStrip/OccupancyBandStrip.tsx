import { useEffect, useMemo, useState } from 'react';
import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import type { ObservedBss } from '@/domain/bss';
import type { BandGhz } from '@/domain/channel';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import {
  bandHasBss,
  pickOccupancyBand,
  visibleOccupancyBands,
} from '@/features/channel-occupancy/bandVisibility';
import { createFormatMessage, type MessageKey } from '@/shared/i18n';
import { useScanIntl } from '@/shared/i18n/ScanIntlProvider';
import { ChannelUtilizationTable } from '@/features/utilization';
import { OccupancyChart } from './OccupancyChart';
import { chartEmptySx, chartToolbarSx, occupancyStripSx } from './styles';

export type OccupancyBandStripProps = {
  bssList: readonly ObservedBss[];
  selectedRow: ScanGridRow | null;
  height?: number;
  hideEmptyBands?: boolean;
};

const BAND_TAB_LABEL: Record<BandGhz, MessageKey> = {
  2.4: 'scan.filter.band.24',
  5: 'scan.filter.band.5',
  6: 'scan.filter.band.6',
};

const BAND_EMPTY_MESSAGE: Partial<Record<BandGhz, MessageKey>> = {
  6: 'scan.filter.band6.empty',
};

function bandToggleValue(band: BandGhz): string {
  return String(band);
}

function bandFromToggleValue(value: string): BandGhz | null {
  const n = Number(value);
  if (n === 2.4 || n === 5 || n === 6) return n;
  return null;
}

export function OccupancyBandStrip({
  bssList,
  selectedRow,
  height = 280,
  hideEmptyBands = false,
}: OccupancyBandStripProps) {
  const { locale } = useScanIntl();
  const formatMessage = useMemo(() => createFormatMessage(locale), [locale]);

  const visibleBands = useMemo(
    () => visibleOccupancyBands(bssList, hideEmptyBands),
    [bssList, hideEmptyBands]
  );

  const preferredBand =
    selectedRow?.band === 2.4 || selectedRow?.band === 5 || selectedRow?.band === 6
      ? selectedRow.band
      : null;

  const [band, setBand] = useState<BandGhz>(() => pickOccupancyBand(preferredBand, visibleBands));

  useEffect(() => {
    setBand((current) => pickOccupancyBand(preferredBand ?? current, visibleBands, current));
  }, [preferredBand, visibleBands]);

  const noVisibleBands = visibleBands.length === 0;
  const activeBand = noVisibleBands ? band : pickOccupancyBand(band, visibleBands, band);
  const showBandTabs = visibleBands.length > 1;
  const bandEmpty = noVisibleBands || !bandHasBss(bssList, activeBand);
  const emptyMessageKey = noVisibleBands
    ? 'scan.chart.empty'
    : (BAND_EMPTY_MESSAGE[activeBand] ?? 'scan.chart.occupancy.band.empty');

  return (
    <Stack spacing={1} sx={occupancyStripSx}>
      {showBandTabs ? (
        <Stack direction="row" sx={chartToolbarSx}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={bandToggleValue(activeBand)}
            onChange={(_, value: string | null) => {
              const next = value ? bandFromToggleValue(value) : null;
              if (next != null) setBand(next);
            }}
          >
            {visibleBands.map((item) => (
              <ToggleButton key={item} value={bandToggleValue(item)}>
                {formatMessage(BAND_TAB_LABEL[item])}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      ) : null}
      {bandEmpty ? (
        <Typography sx={chartEmptySx} variant="body2">
          {noVisibleBands
            ? formatMessage(emptyMessageKey)
            : formatMessage(emptyMessageKey, { band: String(activeBand) })}
        </Typography>
      ) : (
        <OccupancyChart
          band={activeBand}
          bssList={bssList}
          height={height}
          selectedBssid={selectedRow?.band === activeBand ? selectedRow.bssid : null}
          selectedChannel={selectedRow?.band === activeBand ? selectedRow.channel : null}
          selectedColor={selectedRow?.band === activeBand ? selectedRow.seriesColor : undefined}
          showBandInTitle={!showBandTabs}
        />
      )}
      <ChannelUtilizationTable bssList={bssList} />
    </Stack>
  );
}
