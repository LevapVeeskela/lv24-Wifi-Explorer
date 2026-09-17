export type ScanDetailsTab = 'details' | 'signal' | 'occupancy' | 'advanced';

export type ScanShortcutAction =
  | { type: 'focusSearch' }
  | { type: 'clearSearch' }
  | { type: 'toggleScan' }
  | { type: 'setDetailsTab'; tab: ScanDetailsTab }
  | { type: 'copyBssid'; bssid: string }
  | { type: 'saveSnapshot' }
  | { type: 'openSnapshot' };

export type ScanShortcutKeyEvent = Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey'>;

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
  '4': 'advanced',
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
  ctx: ScanShortcutContext,
): ScanShortcutAction[] {
  const actions: ScanShortcutAction[] = [];
  const mod = modKey(event);
  const key = event.key;

  if (mod && key.toLowerCase() === 'f') {
    actions.push({ type: 'focusSearch' });
    return actions;
  }

  if (key === 'Escape' && isSearchFocused(ctx)) {
    actions.push({ type: 'clearSearch' });
    return actions;
  }

  if (mod && key.toLowerCase() === 'p') {
    actions.push({ type: 'toggleScan' });
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
    case 'toggleScan':
    case 'saveSnapshot':
    case 'openSnapshot':
    case 'copyBssid':
      return true;
    default:
      return false;
  }
}
