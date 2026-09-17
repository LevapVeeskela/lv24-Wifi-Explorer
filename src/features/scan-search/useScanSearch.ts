import { useCallback, useMemo } from 'react';
import type { ObservedBss } from '../../domain/bss';
import { parseScanQuery } from './parseScanQuery';
import { matchBss, type ScanSearchMatchContext } from './matchBss';

export function useScanSearch(query: string) {
  const parsed = useMemo(() => parseScanQuery(query), [query]);

  const matches = useCallback(
    (bss: ObservedBss, ctx?: ScanSearchMatchContext) => {
      const trimmed = query.trim();
      if (!trimmed) return true;
      if (parsed.ok) return matchBss(bss, parsed.ast, ctx);
      return matchBss(bss, { type: 'pred', pred: { kind: 'keyword', text: trimmed } }, ctx);
    },
    [parsed, query],
  );

  return {
    parsed,
    matches,
    isActive: parsed.ok && parsed.ast.type !== 'all',
  };
}
