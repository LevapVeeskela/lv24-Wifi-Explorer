import Delete from '@mui/icons-material/Delete';
import Save from '@mui/icons-material/Save';
import {
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { BUILT_IN_DEFAULT_PROFILE_ID } from './types';
import type { UseColumnProfilesResult } from './useColumnProfiles';
import { t } from './t';

export type ColumnProfilesControlsProps = {
  profiles: UseColumnProfilesResult;
};

export function ColumnProfilesControls({ profiles }: ColumnProfilesControlsProps) {
  const [newName, setNewName] = useState('');

  const profileLabel = (id: string, name: string) =>
    id === BUILT_IN_DEFAULT_PROFILE_ID ? t('scan.settings.columns.profile.default') : name;

  const activeIsCustom = profiles.activeProfileId !== BUILT_IN_DEFAULT_PROFILE_ID;

  const onSaveNew = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    profiles.saveCurrentAsProfile(trimmed);
    setNewName('');
  };

  return (
    <Stack spacing={1.5}>
      <Typography color="text.secondary" variant="caption">
        {t('scan.settings.columns.profiles.hint')}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <FormControl fullWidth size="small">
          <InputLabel id="column-profile-select-label">
            {t('scan.settings.columns.profiles.label')}
          </InputLabel>
          <Select
            label={t('scan.settings.columns.profiles.label')}
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
            <Tooltip title={t('scan.settings.columns.profiles.updateActive')}>
              <IconButton
                aria-label={t('scan.settings.columns.profiles.updateActive')}
                size="small"
                onClick={() => profiles.updateActiveProfileFromCurrent()}
              >
                <Save fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('scan.settings.columns.profiles.delete')}>
              <IconButton
                aria-label={t('scan.settings.columns.profiles.delete')}
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
          placeholder={t('scan.settings.columns.profiles.newName')}
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
          {t('scan.settings.columns.profiles.saveAs')}
        </Button>
      </Stack>
    </Stack>
  );
}
