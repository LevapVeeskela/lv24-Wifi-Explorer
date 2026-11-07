import { useEffect } from 'react';
import type { CsvExportScope } from '@/features/export';
import type { MenuIpcAction } from '@/shared/ipc/menuIpc';

export type UseNativeMenuBridgeOptions = {
  onOpenSnapshot: () => void;
  onSaveSnapshot: () => void;
  onExportCsv: (scope: CsvExportScope) => void;
  onPrintVisible: () => void;
  onOpenSettings: () => void;
  onAbout: () => void;
};

function dispatchMenuAction(action: MenuIpcAction, handlers: UseNativeMenuBridgeOptions): void {
  switch (action.type) {
    case 'openSnapshot':
      handlers.onOpenSnapshot();
      break;
    case 'saveSnapshot':
      handlers.onSaveSnapshot();
      break;
    case 'exportCsv':
      handlers.onExportCsv(action.scope);
      break;
    case 'printVisible':
      handlers.onPrintVisible();
      break;
    case 'openSettings':
      handlers.onOpenSettings();
      break;
    case 'about':
      handlers.onAbout();
      break;
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

export function useNativeMenuBridge(handlers: UseNativeMenuBridgeOptions): void {
  const { onOpenSnapshot, onSaveSnapshot, onExportCsv, onPrintVisible, onOpenSettings, onAbout } =
    handlers;

  useEffect(() => {
    const bridge = window.wifiExplorer;
    const subscribe = bridge?.onMenuAction;
    if (!subscribe) return;

    return subscribe((action) => {
      dispatchMenuAction(action, {
        onOpenSnapshot,
        onSaveSnapshot,
        onExportCsv,
        onPrintVisible,
        onOpenSettings,
        onAbout,
      });
    });
  }, [onAbout, onExportCsv, onOpenSettings, onOpenSnapshot, onPrintVisible, onSaveSnapshot]);
}
