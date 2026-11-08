import Delete from '@mui/icons-material/Delete';
import Save from '@mui/icons-material/Save';
import {
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { BUILT_IN_DEFAULT_PROFILE_ID } from './types';
import type { UseColumnProfilesResult } from './useColumnProfiles';
import { useScanIntl } from '@/shared/i18n';
import { openWorkbenchFile, saveWorkbenchFile } from '@/shared/lib/files/rendererFileIo';

export type ColumnProfilesControlsProps = {
  profiles: UseColumnProfilesResult;
};

export function ColumnProfilesControls({ profiles }: ColumnProfilesControlsProps) {
  const { formatMessage } = useScanIntl();
  const [newName, setNewName] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const profileLabel = (id: string, name: string) =>
    id === BUILT_IN_DEFAULT_PROFILE_ID
      ? formatMessage('scan.settings.columns.profile.default')
      : name;

  const activeIsCustom = profiles.activeProfileId !== BUILT_IN_DEFAULT_PROFILE_ID;

  const onExport = async () => {
    await saveWorkbenchFile({
      defaultPath: 'lv24-column-profiles.json',
      contents: profiles.exportProfilesJson(),
      mimeType: 'application/json',
    });
  };

  const onImport = async () => {
    const picked = await openWorkbenchFile({ accept: '.json', extensions: ['json'] });
    if (picked.canceled) return;
    const result = profiles.importProfilesJson(picked.text);
    if (result.error) {
      setNotice(formatMessage('scan.profiles.importError'));
      return;
    }
    setNotice(
      formatMessage('scan.profiles.imported', {
        imported: result.imported,
        skipped: result.skipped,
      })
    );
  };

  const onSaveNew = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    profiles.saveCurrentAsProfile(trimmed);
    setNewName('');
  };

  return (
    <Stack spacing={1.5}>
      <Typography color="text.secondary" variant="caption">
        {formatMessage('scan.settings.columns.profiles.hint')}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <FormControl fullWidth size="small">
          <InputLabel id="column-profile-select-label">
            {formatMessage('scan.settings.columns.profiles.label')}
          </InputLabel>
          <Select
            label={formatMessage('scan.settings.columns.profiles.label')}
            labelId="column-profile-select-label"
            value={profiles.activeProfileId}
            onChange={(event) => profiles.switchProfile(String(event.target.value))}
          >
            {profiles.profiles.map((profile) => (
              <MenuItem key={profile.id} value={profile.id}>
                {profileLabel(profile.id, profile.name)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {activeIsCustom ? (
          <>
            <Tooltip title={formatMessage('scan.settings.columns.profiles.updateActive')}>
              <IconButton
                aria-label={formatMessage('scan.settings.columns.profiles.updateActive')}
                size="small"
                onClick={() => profiles.updateActiveProfileFromCurrent()}
              >
                <Save fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={formatMessage('scan.settings.columns.profiles.delete')}>
              <IconButton
                aria-label={formatMessage('scan.settings.columns.profiles.delete')}
                color="error"
                size="small"
                onClick={() => profiles.deleteProfile(profiles.activeProfileId)}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        ) : null}
      </Stack>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <TextField
          fullWidth
          placeholder={formatMessage('scan.settings.columns.profiles.newName')}
          size="small"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSaveNew();
            }
          }}
        />
        <Button disabled={!newName.trim()} size="small" variant="outlined" onClick={onSaveNew}>
          {formatMessage('scan.settings.columns.profiles.saveAs')}
        </Button>
      </Stack>
      <Stack direction="row" spacing={1}>
        <Button size="small" variant="text" onClick={() => void onExport()}>
          {formatMessage('scan.profiles.export')}
        </Button>
        <Button size="small" variant="text" onClick={() => void onImport()}>
          {formatMessage('scan.profiles.import')}
        </Button>
      </Stack>
      <Snackbar
        autoHideDuration={6000}
        message={notice ?? ''}
        open={notice != null}
        onClose={() => setNotice(null)}
      />
    </Stack>
  );
}
