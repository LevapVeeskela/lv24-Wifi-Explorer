export const locationOnboardingContinueKey = 'onboarding.location.continue' as const;
export const locationOnboardingLaterKey = 'onboarding.location.later' as const;
export const locationOnboardingScanHintKey = 'onboarding.location.scanHint' as const;

export const locationOnboardingEnMessages = {
  [locationOnboardingContinueKey]: 'Continue',
  [locationOnboardingLaterKey]: 'Not now',
  [locationOnboardingScanHintKey]:
    'Active scanning lists nearby access points on a timer (≥ 3 s). Signal strength and channels are available without Location; network names and MAC addresses need your approval.',
} as const;

export const locationOnboardingRuMessages = {
  [locationOnboardingContinueKey]: 'Продолжить',
  [locationOnboardingLaterKey]: 'Не сейчас',
  [locationOnboardingScanHintKey]:
    'Активное сканирование периодически опрашивает точки доступа (интервал ≥ 3 с). Уровень сигнала и каналы доступны без геолокации; имена сетей и MAC-адреса — после вашего разрешения.',
} as const;

export type LocationOnboardingMessageKey =
  | typeof locationOnboardingContinueKey
  | typeof locationOnboardingLaterKey
  | typeof locationOnboardingScanHintKey;
