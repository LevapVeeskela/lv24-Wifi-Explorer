import { useCallback, useMemo, useState } from 'react';
import { loadAnnotations, removeAnnotation, saveAnnotations, upsertAnnotation } from './persist';
import { resolveAnnotation } from './resolveAnnotation';
import type { AnnotationRule } from './types';

export function useAnnotations() {
  const [rules, setRulesState] = useState<AnnotationRule[]>(() => loadAnnotations());

  const persist = useCallback((next: AnnotationRule[]) => {
    setRulesState(next);
    saveAnnotations(next);
  }, []);

  const upsert = useCallback(
    (input: { id?: string; bssidPattern: string; text: string }) => {
      persist(upsertAnnotation(rules, input));
    },
    [persist, rules]
  );

  const remove = useCallback(
    (id: string) => {
      persist(removeAnnotation(rules, id));
    },
    [persist, rules]
  );

  const textFor = useCallback((bssid: string) => resolveAnnotation(bssid, rules), [rules]);

  return useMemo(
    () => ({
      rules,
      setRules: persist,
      upsert,
      remove,
      textFor,
    }),
    [persist, remove, rules, textFor, upsert]
  );
}
