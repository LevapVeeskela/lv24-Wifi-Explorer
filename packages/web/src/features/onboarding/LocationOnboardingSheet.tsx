import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import type { LocationAuthorization } from '@/domain/identity';
import { useScanIntl } from '@/shared/i18n';
import {
  locationOnboardingContinueKey,
  locationOnboardingLaterKey,
  locationOnboardingScanHintKey,
  resolveLocationOnboardingMessages,
} from './i18n/messages';
import {
  locationOnboardingActionsSx,
  locationOnboardingBodySx,
  locationOnboardingContentSx,
  locationOnboardingPaperSx,
} from './styles';

export type LocationOnboardingSheetProps = {
  open: boolean;
  location: LocationAuthorization;
  onClose: () => void;
  onContinue: () => void;
};

export function LocationOnboardingSheet({
  open,
  location,
  onClose,
  onContinue,
}: LocationOnboardingSheetProps) {
  const { formatMessage, locale } = useScanIntl();

  if (location !== 'not-determined') {
    return null;
  }

  const messages = resolveLocationOnboardingMessages(locale);

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={open}
      slotProps={{ paper: { sx: locationOnboardingPaperSx } }}
      onClose={onClose}
    >
      <DialogTitle>{formatMessage('permissions.onboarding.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={locationOnboardingContentSx}>
          <Typography sx={locationOnboardingBodySx} variant="body2">
            {formatMessage('permissions.location.body')}
          </Typography>
          <Typography sx={locationOnboardingBodySx} variant="body2">
            {messages[locationOnboardingScanHintKey]}
          </Typography>
          <Typography sx={locationOnboardingBodySx} variant="body2">
            {formatMessage('permissions.onboarding.body')}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={locationOnboardingActionsSx}>
        <Button color="inherit" onClick={onClose}>
          {messages[locationOnboardingLaterKey]}
        </Button>
        <Button variant="contained" onClick={onContinue}>
          {messages[locationOnboardingContinueKey]}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
