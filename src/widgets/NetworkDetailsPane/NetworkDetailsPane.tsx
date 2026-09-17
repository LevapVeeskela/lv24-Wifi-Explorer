import { useCallback, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import { Snackbar, Stack, Typography } from '@mui/material';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import { qualityMessageKey } from '@/entities/bss/formatters';
import { createFormatMessage } from '@/shared/i18n';
import { useScanIntl } from '@/shared/i18n/ScanIntlProvider';
import { DetailsField } from './DetailsField';
import {
  formatBandField,
  formatCountry,
  formatEncryption,
  formatFrequency,
  formatMaxRate,
  formatNoiseDbm,
  formatPhyMode,
  formatRelativeSeen,
  formatSecurity,
  formatSignalPct,
  formatSnrDetails,
  formatWidthField,
} from './formatFields';
import { detailsEmptySx, detailsEmptyTextSx, detailsPaneSx, detailsSnackbarSx } from './styles';

export type NetworkDetailsPaneProps = {
  row: ScanGridRow | null;
};

export function NetworkDetailsPane({ row }: NetworkDetailsPaneProps) {
  const { locale } = useScanIntl();
  const formatMessage = useMemo(() => createFormatMessage(locale), [locale]);
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback((value: string) => {
    if (!value || value === '—') return;
    void navigator.clipboard?.writeText(value).then(() => setCopied(true));
  }, []);

  if (!row) {
    return (
      <Stack sx={detailsEmptySx}>
        <Typography sx={detailsEmptyTextSx} variant="body2">
          {formatMessage('scan.details.empty')}
        </Typography>
      </Stack>
    );
  }

  const bss = row.source;
  const ssid = row.ssidHidden ? formatMessage('scan.ssid.hidden') : row.ssid || '—';
  const encryption = formatEncryption(bss);
  const country = formatCountry(bss);
  const unavailable = formatMessage('scan.field.unavailable');
  const typeKey = row.networkType === 'ibss' ? 'scan.type.ibss' : 'scan.type.infrastructure';

  return (
    <>
      <Grid columns={12} container spacing={1} sx={detailsPaneSx}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsField
            fieldId="ssid"
            label={formatMessage('scan.details.ssid')}
            value={ssid}
            onCopy={onCopy}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsField
            fieldId="band"
            label={formatMessage('scan.details.band')}
            value={formatBandField(row)}
            onCopy={onCopy}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsField
            fieldId="bssid"
            label={formatMessage('scan.details.bssid')}
            mono
            value={row.bssid}
            onCopy={onCopy}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsField
            fieldId="phyMode"
            label={formatMessage('scan.details.phyMode')}
            value={formatPhyMode(row.phyMode)}
            onCopy={onCopy}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsField
            fieldId="vendor"
            label={formatMessage('scan.details.vendor')}
            unavailable={!row.vendor}
            unavailableHint={unavailable}
            value={row.vendor ?? '—'}
            onCopy={onCopy}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsField
            fieldId="maxRateMbps"
            label={formatMessage('scan.details.maxRateMbps')}
            unavailable={!bss.maxRate}
            unavailableHint={unavailable}
            value={formatMaxRate(bss)}
            onCopy={onCopy}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsField
            fieldId="signalQuality"
            label={formatMessage('scan.details.signalQuality')}
            value={formatMessage(qualityMessageKey(row.signalQuality))}
            onCopy={onCopy}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsField
            fieldId="channel"
            label={formatMessage('scan.details.channel')}
            value={String(row.channel)}
            onCopy={onCopy}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsField
            fieldId="signalPct"
            label={formatMessage('scan.details.signalPct')}
            value={formatSignalPct(row.signalBarPct)}
            onCopy={onCopy}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsField
            fieldId="noiseDbm"
            label={formatMessage('scan.details.noiseDbm')}
            unavailable={row.noiseDbm == null}
            unavailableHint={unavailable}
            value={formatNoiseDbm(row.noiseDbm)}
            onCopy={onCopy}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsField
            fieldId="networkType"
            label={formatMessage('scan.details.networkType')}
            value={formatMessage(typeKey)}
            onCopy={onCopy}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsField
            fieldId="security"
            label={formatMessage('scan.details.security')}
            value={formatSecurity(row)}
            onCopy={onCopy}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsField
            fieldId="encryption"
            label={formatMessage('scan.details.encryption')}
            unavailable={encryption.unavailable}
            unavailableHint={unavailable}
            value={encryption.value}
            onCopy={onCopy}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsField
            fieldId="channelWidth"
            label={formatMessage('scan.details.channelWidth')}
            value={formatWidthField(row)}
            onCopy={onCopy}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsField
            fieldId="snrDb"
            label={formatMessage('scan.details.snrDb')}
            unavailable={row.snrDb == null}
            unavailableHint={unavailable}
            value={formatSnrDetails(row.snrDb)}
            onCopy={onCopy}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsField
            fieldId="frequencyMHz"
            label={formatMessage('scan.details.frequencyMHz')}
            unavailable={bss.channel.primaryCenterMhz == null}
            unavailableHint={unavailable}
            value={formatFrequency(bss)}
            onCopy={onCopy}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsField
            fieldId="country"
            label={formatMessage('scan.details.country')}
            unavailable={country.unavailable}
            unavailableHint={unavailable}
            value={country.value}
            onCopy={onCopy}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsField
            fieldId="firstSeen"
            label={formatMessage('scan.details.firstSeen')}
            value={formatRelativeSeen(bss.presence.firstSeenAt)}
            onCopy={onCopy}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsField
            fieldId="lastSeen"
            label={formatMessage('scan.details.lastSeen')}
            value={formatRelativeSeen(bss.presence.lastSeenAt)}
            onCopy={onCopy}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsField
            fieldId="connected"
            label={formatMessage('scan.details.connected')}
            value={row.connected ? formatMessage('scan.details.connected') : '—'}
            onCopy={onCopy}
          />
        </Grid>
      </Grid>
      <Snackbar
        autoHideDuration={2000}
        message={formatMessage('scan.copied')}
        open={copied}
        sx={detailsSnackbarSx}
        onClose={() => setCopied(false)}
      />
    </>
  );
}
