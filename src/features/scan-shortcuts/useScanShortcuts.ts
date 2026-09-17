import { useEffect, type RefObject } from 'react';
import {
  resolveScanShortcutActions,
  shouldPreventDefault,
  type ScanDetailsTab,
  type ScanShortcutContext,
} from './handleScanShortcut';

export type UseScanShortcutsOptions = {
  searchInputRef: RefObject<HTMLInputElement | null>;
  gridContainerRef: RefObject<HTMLElement | null>;
  selectedBssid: string | null;
  onClearSearch: () => void;
  onToggleScan: () => void;
  onDetailsTabChange: (tab: ScanDetailsTab) => void;
  onSaveSnapshot: () => void;
  onOpenSnapshot: () => void;
};

export function useScanShortcuts({
  searchInputRef,
  gridContainerRef,
  selectedBssid,
  onClearSearch,
  onToggleScan,
  onDetailsTabChange,
  onSaveSnapshot,
  onOpenSnapshot,
}: UseScanShortcutsOptions): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const ctx: ScanShortcutContext = {
        activeElement: document.activeElement,
        searchInput: searchInputRef.current,
        gridRoot: gridContainerRef.current,
        selectedBssid,
      };
      const actions = resolveScanShortcutActions(event, ctx);
      if (actions.length === 0) return;

      for (const action of actions) {
        if (shouldPreventDefault(action)) event.preventDefault();
        switch (action.type) {
          case 'focusSearch':
            searchInputRef.current?.focus();
            break;
          case 'clearSearch':
            onClearSearch();
            break;
          case 'toggleScan':
            onToggleScan();
            break;
          case 'setDetailsTab':
            onDetailsTabChange(action.tab);
            break;
          case 'copyBssid':
            void navigator.clipboard?.writeText(action.bssid);
            break;
          case 'saveSnapshot':
            onSaveSnapshot();
            break;
          case 'openSnapshot':
            void onOpenSnapshot();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    gridContainerRef,
    onClearSearch,
    onDetailsTabChange,
    onOpenSnapshot,
    onSaveSnapshot,
    onToggleScan,
    searchInputRef,
    selectedBssid,
  ]);
}
