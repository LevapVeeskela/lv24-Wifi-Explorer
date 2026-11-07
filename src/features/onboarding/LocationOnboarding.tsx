import type { LocationAuthorization } from '@/domain/identity';
import { LocationOnboardingSheet } from './LocationOnboardingSheet';
import { useLocationOnboardingDismissed } from './useLocationOnboardingDismissed';

export type LocationOnboardingProps = {
  location: LocationAuthorization;
  demoMode?: boolean;
  /** Start active scan so ScanCore can surface the macOS Location prompt. */
  onContinue?: () => void;
};

export function LocationOnboarding({
  location,
  demoMode = false,
  onContinue,
}: LocationOnboardingProps) {
  const [dismissed, dismiss] = useLocationOnboardingDismissed();

  const shouldOffer = !demoMode && location === 'not-determined' && !dismissed;
  const open = shouldOffer;

  const handleClose = () => {
    dismiss();
  };

  const handleContinue = () => {
    dismiss();
    onContinue?.();
  };

  return (
    <LocationOnboardingSheet
      location={location}
      open={open}
      onClose={handleClose}
      onContinue={handleContinue}
    />
  );
}
