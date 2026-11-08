/**
 * Feature-local copy for the location onboarding sheet.
 *
 * Only the keys absent from `shared/i18n` (`permissions.onboarding.*` covers the
 * title/body) live here; `onboarding.location.*` is resolved through
 * {@link resolveLocationOnboardingMessages}.
 */
import { isAppLocale, type AppLocale } from '@/shared/i18n';

export const locationOnboardingContinueKey = 'onboarding.location.continue' as const;
export const locationOnboardingLaterKey = 'onboarding.location.later' as const;
export const locationOnboardingScanHintKey = 'onboarding.location.scanHint' as const;

export type LocationOnboardingMessageKey =
  | typeof locationOnboardingContinueKey
  | typeof locationOnboardingLaterKey
  | typeof locationOnboardingScanHintKey;

export const locationOnboardingEnMessages: Record<LocationOnboardingMessageKey, string> = {
  [locationOnboardingContinueKey]: 'Continue',
  [locationOnboardingLaterKey]: 'Not now',
  [locationOnboardingScanHintKey]:
    'Active scanning lists nearby access points on a timer (≥ 3 s). Signal strength and channels are available without Location; network names and MAC addresses need your approval.',
};

export const locationOnboardingRuMessages: Record<LocationOnboardingMessageKey, string> = {
  [locationOnboardingContinueKey]: 'Продолжить',
  [locationOnboardingLaterKey]: 'Не сейчас',
  [locationOnboardingScanHintKey]:
    'Активное сканирование периодически опрашивает точки доступа (интервал ≥ 3 с). Уровень сигнала и каналы доступны без геолокации; имена сетей и MAC-адреса — после вашего разрешения.',
};

export const locationOnboardingZhMessages: Record<LocationOnboardingMessageKey, string> = {
  [locationOnboardingContinueKey]: '继续',
  [locationOnboardingLaterKey]: '以后再说',
  [locationOnboardingScanHintKey]:
    '主动扫描会按定时器（≥ 3 秒）列出附近的接入点。信号强度和信道无需定位即可使用；网络名称和 MAC 地址需要你的授权。',
};

const catalogs: Record<AppLocale, Record<LocationOnboardingMessageKey, string>> = {
  en: locationOnboardingEnMessages,
  ru: locationOnboardingRuMessages,
  zh: locationOnboardingZhMessages,
};

/** Catalog for a UI locale; unknown locales fall back to English. */
export function resolveLocationOnboardingMessages(
  locale: string
): Record<LocationOnboardingMessageKey, string> {
  return isAppLocale(locale) ? catalogs[locale] : locationOnboardingEnMessages;
}
