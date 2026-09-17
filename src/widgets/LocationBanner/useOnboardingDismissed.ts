import { useCallback, useState } from 'react';
import { STORAGE_LOCATION_ONBOARDING_DISMISSED } from '@/shared/lib/persistence/keys';

function readDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_LOCATION_ONBOARDING_DISMISSED) === '1';
  } catch {
    return false;
  }
}

export function useOnboardingDismissed(): [boolean, () => void] {
  const [dismissed, setDismissed] = useState(readDismissed);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_LOCATION_ONBOARDING_DISMISSED, '1');
    } catch {
      // ignore
    }
  }, []);

  return [dismissed, dismiss];
}
