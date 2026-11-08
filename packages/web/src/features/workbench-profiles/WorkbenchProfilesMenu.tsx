import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import BookmarkBorder from '@mui/icons-material/BookmarkBorder';
import Delete from '@mui/icons-material/Delete';
import {
  activeWorkbenchProfile,
  addWorkbenchProfile,
  deleteWorkbenchProfile,
  loadWorkbenchProfilesStore,
  saveWorkbenchProfilesStore,
  selectWorkbenchProfile,
  applyProfileToState,
  type WorkbenchProfile,
  type WorkbenchStateInput,
  type WorkbenchStatePatch,
  type WorkbenchProfilesStoreV1,
} from '@/features/workbench-profiles';
import { useScanIntl } from '@/shared/i18n/ScanIntlProvider';

export type WorkbenchProfilesMenuProps = {
  state: WorkbenchStateInput;
  onApply: (patch: WorkbenchStatePatch) => void;
};

export function WorkbenchProfilesMenu({ state, onApply }: WorkbenchProfilesMenuProps) {
  const { formatMessage } = useScanIntl();
  const [store, setStore] = useState<WorkbenchProfilesStoreV1>(() => loadWorkbenchProfilesStore());
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState('');

  const persist = (next: WorkbenchProfilesStoreV1) => {
    setStore(next);
    saveWorkbenchProfilesStore(next);
  };

  const active = activeWorkbenchProfile(store);

  const apply = (profile: WorkbenchProfile) => {
    setAnchor(null);
    const mutation = selectWorkbenchProfile(store, profile.id);
    persist(mutation.store);
    onApply(applyProfileToState(profile));
  };

  const saveCurrent = () => {
    const mutation = addWorkbenchProfile(store, name, state);
    if (mutation.error) return;
    persist(mutation.store);
    setSaveOpen(false);
    setName('');
  };

  const remove = (profile: WorkbenchProfile) => {
    const mutation = deleteWorkbenchProfile(store, profile.id);
    if (!mutation.error) persist(mutation.store);
  };

  return (
    <>
      <Tooltip title={formatMessage('scan.profiles.title')}>
        <Button
          onClick={(event) => setAnchor(event.currentTarget)}
          size="small"
          startIcon={<BookmarkBorder />}
          sx={{ textTransform: 'none' }}
          variant="text"
        >
          {active?.name ?? formatMessage('scan.profiles.default')}
        </Button>
      </Tooltip>
      <Menu anchorEl={anchor} onClose={() => setAnchor(null)} open={anchor != null}>
        <Typography color="text.secondary" sx={{ px: 2, pb: 0.5 }} variant="caption">
          {formatMessage('scan.profiles.title')}
        </Typography>
        {store.profiles.map((profile) => (
          <MenuItem
            key={profile.id}
            onClick={() => apply(profile)}
            selected={profile.id === store.activeProfileId}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', width: '100%' }}>
              <span style={{ flex: 1 }}>
                {profile.builtIn ? formatMessage('scan.profiles.default') : profile.name}
              </span>
              {!profile.builtIn ? (
                <IconButton
                  aria-label={formatMessage('scan.profiles.delete')}
                  onClick={(event) => {
                    event.stopPropagation();
                    remove(profile);
                  }}
                  size="small"
                >
                  <Delete fontSize="small" />
                </IconButton>
              ) : null}
            </Stack>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchor(null);
            setSaveOpen(true);
          }}
        >
          {formatMessage('scan.profiles.save')}
        </MenuItem>
      </Menu>
      <Dialog fullWidth maxWidth="xs" onClose={() => setSaveOpen(false)} open={saveOpen}>
        <DialogTitle>{formatMessage('scan.profiles.save')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={formatMessage('scan.profiles.name')}
            onChange={(event) => setName(event.target.value)}
            sx={{ mt: 1 }}
            value={name}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveOpen(false)}>
            {formatMessage('scan.profiles.cancel')}
          </Button>
          <Button disabled={name.trim().length === 0} onClick={saveCurrent} variant="contained">
            {formatMessage('scan.profiles.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
