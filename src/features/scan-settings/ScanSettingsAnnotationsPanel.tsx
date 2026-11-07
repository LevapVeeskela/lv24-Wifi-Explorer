import Delete from '@mui/icons-material/Delete';
import {
  Button,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useSettingsMessage } from './useSettingsMessage';
import type { ScanSettingsAnnotationRule } from './types';

export type ScanSettingsAnnotationsPanelProps = {
  rules: readonly ScanSettingsAnnotationRule[];
  onUpsert?: (input: { id?: string; bssidPattern: string; text: string }) => void;
  onRemove?: (id: string) => void;
  onImportCsv?: (text: string) => void;
  onExportCsv?: () => string;
};

export function ScanSettingsAnnotationsPanel({
  rules,
  onUpsert,
  onRemove,
  onImportCsv,
  onExportCsv,
}: ScanSettingsAnnotationsPanelProps) {
  const msg = useSettingsMessage();
  const [pattern, setPattern] = useState('');
  const [text, setText] = useState('');

  const canEdit = Boolean(onUpsert && onRemove);

  const addRule = () => {
    const trimmedPattern = pattern.trim();
    const trimmedText = text.trim();
    if (!trimmedPattern || !trimmedText || !onUpsert) return;
    onUpsert({ bssidPattern: trimmedPattern, text: trimmedText });
    setPattern('');
    setText('');
  };

  const importCsv = () => {
    if (!onImportCsv) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      void file.text().then((csv) => onImportCsv(csv));
    };
    input.click();
  };

  const exportCsv = () => {
    if (!onExportCsv) return;
    const csv = onExportCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'lv24-annotations.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1}>
        <Button disabled={!onImportCsv} size="small" variant="outlined" onClick={importCsv}>
          {msg('scan.settings.annotations.import')}
        </Button>
        <Button disabled={!onExportCsv || rules.length === 0} size="small" variant="outlined" onClick={exportCsv}>
          {msg('scan.settings.annotations.export')}
        </Button>
      </Stack>

      {canEdit ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            fullWidth
            label={msg('scan.settings.annotations.pattern')}
            size="small"
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
          />
          <TextField
            fullWidth
            label={msg('scan.settings.annotations.text')}
            size="small"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <Button disabled={!pattern.trim() || !text.trim()} variant="contained" onClick={addRule}>
            {msg('scan.settings.annotations.add')}
          </Button>
        </Stack>
      ) : null}

      {rules.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          {msg('scan.settings.annotations.empty')}
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{msg('scan.settings.annotations.pattern')}</TableCell>
              <TableCell>{msg('scan.settings.annotations.text')}</TableCell>
              {canEdit ? <TableCell width={48} /> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>{rule.bssidPattern}</TableCell>
                <TableCell>{rule.text}</TableCell>
                {canEdit ? (
                  <TableCell>
                    <IconButton
                      aria-label={msg('scan.settings.annotations.remove')}
                      size="small"
                      onClick={() => onRemove?.(rule.id)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Stack>
  );
}
