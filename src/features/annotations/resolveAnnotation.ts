import { matchBssidPattern, patternSpecificity } from './matchPattern';
import type { AnnotationRule } from './types';

/**
 * Pick the note for a BSSID. Exact patterns beat wildcards; among the same
 * class, a longer literal pattern wins. Equal score → later rule wins.
 */
export function resolveAnnotation(
  bssid: string,
  rules: readonly AnnotationRule[]
): string | null {
  let best: { text: string; score: number; index: number } | null = null;

  for (let i = 0; i < rules.length; i += 1) {
    const rule = rules[i];
    const text = rule.text.trim();
    if (!text) continue;
    if (!matchBssidPattern(rule.bssidPattern, bssid)) continue;

    const score = patternSpecificity(rule.bssidPattern);
    if (
      !best ||
      score > best.score ||
      (score === best.score && i > best.index)
    ) {
      best = { text, score, index: i };
    }
  }

  return best?.text ?? null;
}

export function resolveAnnotationMap(
  bssids: readonly string[],
  rules: readonly AnnotationRule[]
): Map<string, string> {
  const out = new Map<string, string>();
  for (const bssid of bssids) {
    const text = resolveAnnotation(bssid, rules);
    if (text) out.set(bssid, text);
  }
  return out;
}
