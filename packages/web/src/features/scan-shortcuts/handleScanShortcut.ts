export type ScanDetailsTab = 'details' | 'signal' | 'occupancy' | 'compare' | 'advanced';

export type ScanShortcutAction =
  | { type: 'focusSearch' }
  | { type: 'clearSearch' }
  | { type: 'startScan' }
  | { type: 'stopScan' }
  | { type: 'setDetailsTab'; tab: ScanDetailsTab }
  | { type: 'copyBssid'; bssid: string }
  | { type: 'saveSnapshot' }
  | { type: 'openSnapshot' }
  | { type: 'setMinRssi'; dbm: number };

export type ScanShortcutKeyEvent = Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey'> &
  Partial<Pick<KeyboardEvent, 'shiftKey' | 'altKey'>>;

export type ScanShortcutContext = {
  activeElement: Element | null;
  searchInput: HTMLInputElement | null;
  gridRoot: HTMLElement | null;
  selectedBssid: string | null;
};

const DETAILS_TAB_BY_DIGIT: Record<string, ScanDetailsTab> = {
  '1': 'details',
  '2': 'signal',
  '3': 'occupancy',
  '4': 'compare',
  '5': 'advanced',
};

/** Option+0–9 → min-RSSI floor in dBm (−95 … −50, step 5). */
const RSSI_FLOOR_BY_DIGIT: Record<string, number> = {
  '0': -95,
  '1': -90,
  '2': -85,
  '3': -80,
  '4': -75,
  '5': -70,
  '6': -65,
  '7': -60,
  '8': -55,
  '9': -50,
};

function modKey(event: ScanShortcutKeyEvent): boolean {
  return event.metaKey || event.ctrlKey;
}

export function isGridFocused(ctx: ScanShortcutContext): boolean {
  const { gridRoot, activeElement } = ctx;
  if (!gridRoot || !activeElement) return false;
  return gridRoot.contains(activeElement);
}

export function isSearchFocused(ctx: ScanShortcutContext): boolean {
  const { searchInput, activeElement } = ctx;
  if (!searchInput || !activeElement) return false;
  return activeElement === searchInput || searchInput.contains(activeElement);
}

export function resolveScanShortcutActions(
  event: ScanShortcutKeyEvent,
  ctx: ScanShortcutContext
): ScanShortcutAction[] {
  const actions: ScanShortcutAction[] = [];
  const mod = modKey(event);
  const key = event.key;

  if (event.altKey && !mod && key in RSSI_FLOOR_BY_DIGIT) {
    actions.push({ type: 'setMinRssi', dbm: RSSI_FLOOR_BY_DIGIT[key]! });
    return actions;
  }

  if (mod && key.toLowerCase() === 'f') {
    actions.push({ type: 'focusSearch' });
    return actions;
  }

  if (key === 'Escape' && isSearchFocused(ctx)) {
    actions.push({ type: 'clearSearch' });
    return actions;
  }

  if (mod && event.shiftKey && key.toLowerCase() === 's') {
    actions.push({ type: 'startScan' });
    return actions;
  }

  if (mod && event.shiftKey && key.toLowerCase() === 't') {
    actions.push({ type: 'stopScan' });
    return actions;
  }

  if (mod && key.toLowerCase() === 's') {
    actions.push({ type: 'saveSnapshot' });
    return actions;
  }

  if (mod && key.toLowerCase() === 'o') {
    actions.push({ type: 'openSnapshot' });
    return actions;
  }

  if (mod && key.toLowerCase() === 'c') {
    if (isGridFocused(ctx) && ctx.selectedBssid) {
      actions.push({ type: 'copyBssid', bssid: ctx.selectedBssid });
    }
    return actions;
  }

  if (mod && key in DETAILS_TAB_BY_DIGIT) {
    actions.push({ type: 'setDetailsTab', tab: DETAILS_TAB_BY_DIGIT[key]! });
  }

  return actions;
}

export function shouldPreventDefault(action: ScanShortcutAction): boolean {
  switch (action.type) {
    case 'focusSearch':
    case 'startScan':
    case 'stopScan':
    case 'saveSnapshot':
    case 'openSnapshot':
    case 'copyBssid':
    case 'setMinRssi':
      return true;
    default:
      return false;
  }
}
