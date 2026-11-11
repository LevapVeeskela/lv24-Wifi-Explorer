import { useMemo } from 'react';
import { Alert, Box, Chip, Divider, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import type { ScanGridRow } from '@/entities/bss';
import {
  evaluateCompatibility,
  type CompatibilityFactorId,
  type CompatibilityFactorStatus,
  type CompatibilityFindingId,
  type CompatibilityFinding,
} from '@/domain';
import { useScanIntl, type MessageKey } from '@/shared/i18n';
import { useAdapterCapabilities } from '@/features/compatibility';
import { compatibilityPaneSx, compatibilityScoreSx } from './styles';

const FACTOR_LABEL: Record<CompatibilityFactorId, MessageKey> = {
  band: 'scan.compat.factor.band',
  phy: 'scan.compat.factor.phy',
  width: 'scan.compat.factor.width',
  security: 'scan.compat.factor.security',
  signal: 'scan.compat.factor.signal',
};

const STATUS_LABEL: Record<string, MessageKey> = {
  ok: 'scan.compat.status.ok',
  partial: 'scan.compat.status.partial',
  fail: 'scan.compat.status.fail',
  unknown: 'scan.compat.status.unknown',
};

const STATUS_COLOR: Record<CompatibilityFactorStatus, 'success' | 'warning' | 'error' | 'default'> =
  {
    ok: 'success',
    partial: 'warning',
    fail: 'error',
    unknown: 'default',
  };

const PROGRESS_COLOR: Record<
  CompatibilityFactorStatus,
  'success' | 'warning' | 'error' | 'inherit'
> = {
  ok: 'success',
  partial: 'warning',
  fail: 'error',
  unknown: 'inherit',
};

const FINDING_META: Record<
  CompatibilityFindingId,
  { title: MessageKey; detail: MessageKey; fix: MessageKey }
> = {
  bandUnsupported: {
    title: 'scan.compat.finding.bandUnsupported.title',
    detail: 'scan.compat.finding.bandUnsupported.detail',
    fix: 'scan.compat.finding.bandUnsupported.fix',
  },
  phyOlder: {
    title: 'scan.compat.finding.phyOlder.title',
    detail: 'scan.compat.finding.phyOlder.detail',
    fix: 'scan.compat.finding.phyOlder.fix',
  },
  widthLimited: {
    title: 'scan.compat.finding.widthLimited.title',
    detail: 'scan.compat.finding.widthLimited.detail',
    fix: 'scan.compat.finding.widthLimited.fix',
  },
  securityOlder: {
    title: 'scan.compat.finding.securityOlder.title',
    detail: 'scan.compat.finding.securityOlder.detail',
    fix: 'scan.compat.finding.securityOlder.fix',
  },
  weakSignal: {
    title: 'scan.compat.finding.weakSignal.title',
    detail: 'scan.compat.finding.weakSignal.detail',
    fix: 'scan.compat.finding.weakSignal.fix',
  },
  dfsChannel: {
    title: 'scan.compat.finding.dfsChannel.title',
    detail: 'scan.compat.finding.dfsChannel.detail',
    fix: 'scan.compat.finding.dfsChannel.fix',
  },
  width40On24: {
    title: 'scan.compat.finding.width40On24.title',
    detail: 'scan.compat.finding.width40On24.detail',
    fix: 'scan.compat.finding.width40On24.fix',
  },
  openNetwork: {
    title: 'scan.compat.finding.openNetwork.title',
    detail: 'scan.compat.finding.openNetwork.detail',
    fix: 'scan.compat.finding.openNetwork.fix',
  },
  unknownAdapter: {
    title: 'scan.compat.finding.unknownAdapter.title',
    detail: 'scan.compat.finding.unknownAdapter.detail',
    fix: 'scan.compat.finding.unknownAdapter.fix',
  },
};

const SIDE_LABEL: Record<CompatibilityFinding['side'], MessageKey> = {
  router: 'scan.compat.side.router',
  device: 'scan.compat.side.device',
  both: 'scan.compat.side.both',
};

export type CompatibilityPaneProps = {
  row: ScanGridRow | null;
};

export function CompatibilityPane({ row }: CompatibilityPaneProps) {
  const { formatMessage } = useScanIntl();
  const adapter = useAdapterCapabilities();
  const result = useMemo(
    () =>
      row && adapter.capabilities ? evaluateCompatibility(row.source, adapter.capabilities) : null,
    [row, adapter.capabilities]
  );

  if (!row) {
    return (
      <Box sx={compatibilityPaneSx}>
        <Typography color="text.secondary" variant="body2">
          {formatMessage('scan.compat.empty')}
        </Typography>
      </Box>
    );
  }

  if (adapter.status === 'loading') {
    return (
      <Box sx={compatibilityPaneSx}>
        <Typography color="text.secondary" variant="body2">
          {formatMessage('scan.compat.loading')}
        </Typography>
        <LinearProgress sx={{ mt: 1 }} />
      </Box>
    );
  }

  if (adapter.status === 'error' || !result) {
    return (
      <Box sx={compatibilityPaneSx}>
        <Alert severity="info">
          {formatMessage(
            adapter.errorCode === 'UNSUPPORTED'
              ? 'scan.compat.unavailable'
              : 'scan.compat.noAdapter'
          )}
        </Alert>
      </Box>
    );
  }

  const scoreColor =
    result.score >= 8 ? 'success.main' : result.score >= 5 ? 'warning.main' : 'error.main';
  const confidenceKey = `scan.compat.confidence.${result.confidence}` as MessageKey;

  return (
    <Box sx={compatibilityPaneSx}>
      <Paper elevation={0} sx={compatibilityScoreSx} variant="outlined">
        <Box>
          <Typography color="text.secondary" variant="overline">
            {formatMessage('scan.compat.score')}
          </Typography>
          <Typography sx={{ color: scoreColor, fontWeight: 700 }} variant="h3">
            {formatMessage('scan.compat.scoreValue', { score: result.score })}
          </Typography>
        </Box>
        <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
          <Chip
            color={
              result.confidence === 'high'
                ? 'success'
                : result.confidence === 'partial'
                  ? 'warning'
                  : 'default'
            }
            label={`${formatMessage('scan.compat.confidence')}: ${formatMessage(confidenceKey)}`}
            size="small"
          />
          <Typography color="text.secondary" variant="caption">
            {adapter.capabilities?.source}
            {adapter.capabilities?.interfaceName ? ` · ${adapter.capabilities.interfaceName}` : ''}
          </Typography>
        </Stack>
      </Paper>

      <LinearProgress
        color={result.score >= 8 ? 'success' : result.score >= 5 ? 'warning' : 'error'}
        sx={{ borderRadius: 1, height: 8, my: 2 }}
        value={result.score * 10}
        variant="determinate"
      />

      {result.estimated ? (
        <Typography color="text.secondary" sx={{ mb: 1 }} variant="caption">
          {formatMessage('scan.compat.estimated')}
        </Typography>
      ) : null}

      <Stack spacing={1.25}>
        {result.factors.map((factor) => (
          <Box key={factor.id}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2">{formatMessage(FACTOR_LABEL[factor.id])}</Typography>
              <Chip
                color={STATUS_COLOR[factor.status]}
                label={`${formatMessage(STATUS_LABEL[factor.status])} · ${factor.earned}/${factor.max}`}
                size="small"
                variant="outlined"
              />
            </Stack>
            <LinearProgress
              color={PROGRESS_COLOR[factor.status]}
              sx={{ borderRadius: 1, height: 5, mt: 0.5 }}
              value={(factor.earned / factor.max) * 100}
              variant="determinate"
            />
          </Box>
        ))}
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Typography sx={{ mb: 1 }} variant="subtitle2">
        {formatMessage('scan.compat.findings')}
      </Typography>
      {result.findings.length === 0 ? (
        <Alert severity="success">{formatMessage('scan.compat.noFindings')}</Alert>
      ) : (
        <Stack spacing={1}>
          {result.findings.map((finding) => {
            const meta = FINDING_META[finding.id];
            return (
              <Paper key={finding.id} sx={{ p: 1.5 }} variant="outlined">
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                  <Chip
                    color={
                      finding.severity === 'critical'
                        ? 'error'
                        : finding.severity === 'warning'
                          ? 'warning'
                          : 'info'
                    }
                    label={formatMessage(`scan.compat.severity.${finding.severity}` as MessageKey)}
                    size="small"
                  />
                  <Chip
                    label={formatMessage(SIDE_LABEL[finding.side])}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatMessage(meta.title)}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.25 }} variant="caption">
                  {formatMessage(meta.detail)}
                </Typography>
                <Typography sx={{ mt: 0.5 }} variant="body2">
                  {formatMessage(meta.fix)}
                </Typography>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
