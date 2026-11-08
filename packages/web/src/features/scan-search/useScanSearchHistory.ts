import { useCallback, useState } from 'react';
import { loadScanSearchHistory, saveScanSearchHistory } from './persistSearchHistory';
import { pushScanSearchHistory } from './searchHistory';

function historiesEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

export function useScanSearchHistory() {
  const [history, setHistory] = useState<string[]>(() => loadScanSearchHistory());

  const recordCommit = useCallback((query: string) => {
    setHistory((prev) => {
      const next = pushScanSearchHistory(prev, query);
      if (historiesEqual(next, prev)) return prev;
      saveScanSearchHistory(next);
      return next;
    });
  }, []);

  return { history, recordCommit };
}
