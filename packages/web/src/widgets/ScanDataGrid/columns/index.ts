import type { GridColDef } from '@mui/x-data-grid-pro';
import type { ScanGridRow } from '@/entities/bss';
import { identityColumns } from './identityColumns';
import { ieColumns } from './ieColumns';
import { radioColumns } from './radioColumns';
import { securityColumns } from './securityColumns';
import type { ColumnContext } from './types';

export type { ColumnContext } from './types';

/**
 * Assembles the scan grid columns in their display order.
 * Security columns are interleaved: lock after SSID, token before radio levels.
 */
export function buildScanGridColumns({
  formatMessage,
  signalUnit,
}: ColumnContext): GridColDef<ScanGridRow>[] {
  const identity = identityColumns({ formatMessage, signalUnit });
  const security = securityColumns({ formatMessage, signalUnit });
  const radio = radioColumns({ formatMessage, signalUnit });
  const ie = ieColumns({ formatMessage, signalUnit });

  return [
    identity.seriesColor,
    identity.bssid,
    identity.ssid,
    security.securityLock,
    identity.vendor,
    identity.apName,
    identity.annotation,
    identity.issueFlags,
    radio.signal,
    radio.signalTrend,
    radio.channel,
    radio.channelWidth,
    radio.band,
    radio.phyMode,
    security.security,
    radio.rssiDbm,
    radio.noiseDbm,
    radio.snrDb,
    ie.lastSeenAt,
    ie.unii,
    ie.firstSeenAt,
    ie.uptimeSec,
    ie.centerFreqMhz,
    ie.maxRateMbps,
    ie.streams,
    ie.amendments,
    ie.generation,
    ie.countryCode,
    ie.beaconIntervalMs,
    ie.dtimPeriod,
    ie.bssLoadStations,
    ie.bssLoadUtilPct,
    ie.channelUtilPct,
    ie.ieCount,
    ie.ieBytes,
    security.wps,
    security.mfp,
    security.ft,
    ie.networkType,
  ];
}
