import { useCallback, useEffect, useState } from 'react';
import {
  COLUMN_RULES_CHANGED_EVENT,
  COLUMN_RULES_STORAGE_KEY,
  DEFAULT_COLUMN_RULES,
} from './constants';
import type { ColumnRulesConfig } from './types';
import {
  defaultColumnRulesStorage,
  loadColumnRules,
  saveColumnRules,
  type ColumnRulesStorage,
} from './persist';

export function useColumnRules(storage: ColumnRulesStorage | null = defaultColumnRulesStorage()) {
  const [config, setConfigState] = useState<ColumnRulesConfig>(() => loadColumnRules(storage));

  useEffect(() => {
    setConfigState(loadColumnRules(storage));
  }, [storage]);

  useEffect(() => {
    const reload = () => {
      setConfigState(loadColumnRules(storage));
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === COLUMN_RULES_STORAGE_KEY) reload();
    };
    window.addEventListener(COLUMN_RULES_CHANGED_EVENT, reload);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(COLUMN_RULES_CHANGED_EVENT, reload);
      window.removeEventListener('storage', onStorage);
    };
  }, [storage]);

  const setConfig = useCallback(
    (next: ColumnRulesConfig) => {
      setConfigState(next);
      saveColumnRules(next, storage);
    },
    [storage]
  );

  const resetConfig = useCallback(() => {
    setConfig({ ...DEFAULT_COLUMN_RULES });
  }, [setConfig]);

  return { config, setConfig, resetConfig };
}
