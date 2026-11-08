import { Alert, AlertTitle, Button } from '@mui/material';
import type { LocationAuthorization } from '@/domain/identity';
import { useScanIntl } from '@/shared/i18n';
import { locationBannerSx } from './styles';
import { useOnboardingDismissed } from './useOnboardingDismissed';

export type LocationBannerProps = {
  location: LocationAuthorization;
  demoMode?: boolean;
};

function openLocationSettings(): void {
  window.wifiExplorer?.permissionsOpenSettings?.();
}

function canOpenLocationSettings(): boolean {
  return typeof window.wifiExplorer?.permissionsOpenSettings === 'function';
}

export function LocationBanner({ location, demoMode = false }: LocationBannerProps) {
  const { formatMessage } = useScanIntl();
  const [onboardingDismissed, dismissOnboarding] = useOnboardingDismissed();

  if (demoMode || location === 'granted') {
    return null;
  }

  if (location === 'not-determined') {
    if (onboardingDismissed) {
      return null;
    }
    return (
      <Alert severity="info" sx={locationBannerSx} onClose={dismissOnboarding}>
        <AlertTitle>{formatMessage('permissions.onboarding.title')}</AlertTitle>
        {formatMessage('permissions.onboarding.body')}
      </Alert>
    );
  }

  if (location === 'denied') {
    return (
      <Alert
        severity="warning"
        sx={locationBannerSx}
        action={
          canOpenLocationSettings() ? (
            <Button color="inherit" size="small" variant="outlined" onClick={openLocationSettings}>
              {formatMessage('permissions.openSettings')}
            </Button>
          ) : undefined
        }
      >
        <AlertTitle>{formatMessage('permissions.denied.title')}</AlertTitle>
        {formatMessage('permissions.denied.body')}
      </Alert>
    );
  }

  return (
    <Alert severity="error" sx={locationBannerSx}>
      <AlertTitle>{formatMessage('permissions.restricted.title')}</AlertTitle>
      {formatMessage('permissions.restricted.body')}
    </Alert>
  );
}
