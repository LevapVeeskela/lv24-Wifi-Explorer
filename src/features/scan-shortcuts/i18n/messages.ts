/** Status bar hint for workbench keyboard shortcuts (integrates as `scan.status.shortcutsHint`). */
export const scanShortcutsStatusHintKey = 'scan.status.shortcutsHint' as const;

export const scanShortcutsEnMessages = {
  [scanShortcutsStatusHintKey]:
    '⌘F search · ⌘⇧S start scan · ⌘⇧T stop · ⌘1–4 details · ⌘C BSSID when grid focused',
} as const;

export const scanShortcutsRuMessages = {
  [scanShortcutsStatusHintKey]:
    '⌘F поиск · ⌘⇧S старт скана · ⌘⇧T стоп · ⌘1–4 сведения · ⌘C BSSID при фокусе в таблице',
} as const;
