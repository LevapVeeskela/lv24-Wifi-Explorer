import { Stack, Typography } from '@mui/material';
import ouiMeta from '@resources/oui/meta.json';
import { useSettingsMessage } from './useSettingsMessage';

type OuiMeta = {
  entryCount?: number;
  generatedAt?: string;
  sourceUrl?: string;
  note?: string;
};

const meta = ouiMeta as OuiMeta;

function formatGeneratedAt(iso: string | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return iso;
  return date.toLocaleString();
}

export function ScanSettingsVendorPanel() {
  const msg = useSettingsMessage();
  return (
    <Stack spacing={2}>
      <Typography variant="body2">{msg('scan.settings.vendor.bundled')}</Typography>
      {meta.entryCount != null ? (
        <Typography variant="body2">
          {msg('scan.settings.vendor.entries', { count: meta.entryCount })}
        </Typography>
      ) : null}
      <Typography color="text.secondary" variant="body2">
        {msg('scan.settings.vendor.updated', { date: formatGeneratedAt(meta.generatedAt) })}
      </Typography>
      {meta.sourceUrl ? (
        <Typography color="text.secondary" variant="caption" component="div">
          {meta.sourceUrl}
        </Typography>
      ) : null}
      {meta.note ? (
        <Typography color="text.secondary" variant="caption">
          {meta.note}
        </Typography>
      ) : null}
      <Typography color="text.secondary" variant="body2">
        {msg('scan.settings.vendor.refreshHint')}
      </Typography>
    </Stack>
  );
}
