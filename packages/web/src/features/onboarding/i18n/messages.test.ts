import { describe, expect, it } from 'vitest';
import {
  locationOnboardingContinueKey,
  locationOnboardingEnMessages,
  locationOnboardingRuMessages,
  locationOnboardingScanHintKey,
  locationOnboardingZhMessages,
  resolveLocationOnboardingMessages,
} from './messages';

describe('resolveLocationOnboardingMessages', () => {
  it('returns the Chinese catalog for zh', () => {
    const messages = resolveLocationOnboardingMessages('zh');
    expect(messages).toBe(locationOnboardingZhMessages);
    expect(messages[locationOnboardingContinueKey]).toBe('继续');
    expect(messages[locationOnboardingScanHintKey]).toContain('MAC');
  });

  it('keeps ru and en catalogs', () => {
    expect(resolveLocationOnboardingMessages('ru')).toBe(locationOnboardingRuMessages);
    expect(resolveLocationOnboardingMessages('en')).toBe(locationOnboardingEnMessages);
  });

  it('falls back to English for unknown locales', () => {
    expect(resolveLocationOnboardingMessages('de')).toBe(locationOnboardingEnMessages);
    expect(resolveLocationOnboardingMessages('')).toBe(locationOnboardingEnMessages);
  });
});
