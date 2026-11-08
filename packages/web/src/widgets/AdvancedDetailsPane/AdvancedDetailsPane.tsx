import { useMemo } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Grid from '@mui/material/Grid';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import { createFormatMessage } from '@/shared/i18n';
import { useScanIntl } from '@/shared/i18n/ScanIntlProvider';
import { DetailsField } from '@/widgets/NetworkDetailsPane';
import {
  formatBandField,
  formatCountry,
  formatEncryption,
  formatFrequency,
  formatMaxRate,
  formatNoiseDbm,
  formatPhyMode,
  formatSecurity,
  formatSnrDetails,
  formatWidthField,
} from '@/widgets/NetworkDetailsPane/formatFields';
import {
  advancedChipRowSx,
  advancedDetailsSx,
  advancedEmptySx,
  advancedEmptyTextSx,
  advancedStackSx,
} from './styles';

export type AdvancedDetailsPaneProps = {
  row: ScanGridRow | null;
};

export function AdvancedDetailsPane({ row }: AdvancedDetailsPaneProps) {
  const { locale } = useScanIntl();
  const formatMessage = useMemo(() => createFormatMessage(locale), [locale]);

  if (!row) {
    return (
      <Stack sx={advancedEmptySx}>
        <Typography sx={advancedEmptyTextSx} variant="body2">
          {formatMessage('scan.details.empty')}
        </Typography>
      </Stack>
    );
  }

  const bss = row.source;
  const unavailable = formatMessage('scan.field.unavailable');
  const encryption = formatEncryption(bss);
  const country = formatCountry(bss);
  const ieIds = bss.ie.presentIds.length > 0 ? bss.ie.presentIds.join(', ') : '—';

  return (
    <Stack spacing={0} sx={advancedStackSx}>
      <Accordion defaultExpanded disableGutters square>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle2">{formatMessage('scan.adv.radio')}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={advancedDetailsSx}>
          <Grid columns={12} container spacing={1}>
            <Grid size={{ xs: 12, md: 6 }}>
              <DetailsField
                fieldId="adv.channel"
                label={formatMessage('scan.details.channel')}
                value={String(row.channel)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DetailsField
                fieldId="adv.band"
                label={formatMessage('scan.details.band')}
                value={formatBandField(row)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DetailsField
                fieldId="adv.width"
                label={formatMessage('scan.details.channelWidth')}
                value={formatWidthField(row)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DetailsField
                fieldId="adv.frequency"
                label={formatMessage('scan.details.frequencyMHz')}
                unavailable={bss.channel.primaryCenterMhz == null}
                unavailableHint={unavailable}
                value={formatFrequency(bss)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DetailsField
                fieldId="adv.phy"
                label={formatMessage('scan.details.phyMode')}
                value={formatPhyMode(row.phyMode)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DetailsField
                fieldId="adv.maxRate"
                label={formatMessage('scan.details.maxRateMbps')}
                unavailable={!bss.maxRate}
                unavailableHint={unavailable}
                value={formatMaxRate(bss)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DetailsField
                fieldId="adv.noise"
                label={formatMessage('scan.details.noiseDbm')}
                unavailable={row.noiseDbm == null}
                unavailableHint={unavailable}
                value={formatNoiseDbm(row.noiseDbm)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DetailsField
                fieldId="adv.snr"
                label={formatMessage('scan.details.snrDb')}
                unavailable={row.snrDb == null}
                unavailableHint={unavailable}
                value={formatSnrDetails(row.snrDb)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DetailsField
                fieldId="adv.country"
                label={formatMessage('scan.details.country')}
                unavailable={country.unavailable}
                unavailableHint={unavailable}
                value={country.value}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      <Accordion disableGutters square>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle2">{formatMessage('scan.adv.security')}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={advancedDetailsSx}>
          <Grid columns={12} container spacing={1}>
            <Grid size={{ xs: 12, md: 6 }}>
              <DetailsField
                fieldId="adv.security"
                label={formatMessage('scan.details.security')}
                value={formatSecurity(row)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DetailsField
                fieldId="adv.encryption"
                label={formatMessage('scan.details.encryption')}
                unavailable={encryption.unavailable}
                unavailableHint={unavailable}
                value={encryption.value}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 12 }}>
              <DetailsField
                fieldId="adv.flags"
                label={formatMessage('scan.details.security')}
                value={bss.security.flags.join(', ') || '—'}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      <Accordion disableGutters square>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle2">{formatMessage('scan.adv.ies')}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={advancedDetailsSx}>
          <Grid columns={12} container spacing={1}>
            <Grid size={{ xs: 12, md: 12 }}>
              <DetailsField
                fieldId="adv.ie.summary"
                label={formatMessage('scan.adv.ies')}
                unavailable={bss.ie.level === 'absent'}
                unavailableHint={unavailable}
                value={`${bss.ie.level} · ${bss.ie.byteLength} B · ${ieIds}`}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      <Accordion disableGutters square>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle2">{formatMessage('scan.adv.issues')}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={advancedDetailsSx}>
          <Stack direction="row" sx={advancedChipRowSx}>
            {row.issueKeys.length === 0 ? (
              <Typography variant="body2">—</Typography>
            ) : (
              row.issueKeys.map((key) => (
                <Chip key={key} label={formatMessage(key as never)} size="small" />
              ))
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
}
