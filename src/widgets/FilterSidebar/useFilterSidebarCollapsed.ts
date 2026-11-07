import { useCallback, useState } from 'react';

const STORAGE_KEY = 'lv24.wifi-explorer.filter-sidebar-collapsed';

export function useFilterSidebarCollapsed(): [boolean, (next: boolean) => void] {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const update = useCallback((next: boolean) => {
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      // ignore
    }
  }, []);

  return [collapsed, update];
}
