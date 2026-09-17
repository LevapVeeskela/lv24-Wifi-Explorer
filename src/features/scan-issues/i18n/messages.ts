/** Issue strip copy (EN). Keys integrate with app i18n as `scan.issue.*`. */
export const scanIssueEnMessages = {
  'scan.issue.width40on24': '40 MHz or wider on 2.4 GHz',
  'scan.issue.overlap24': 'Non-standard 2.4 GHz channel',
  'scan.issue.crowdedChannel': 'Crowded channel',
  'scan.issue.lowSignal': 'Low signal',
  'scan.issue.lowSnr': 'Low SNR',
  'scan.issue.weakSecurity': 'Weak security',
  'scan.issue.hiddenSsid': 'Hidden network name',
  'scan.issue.legacyOnly': 'Legacy Wi‑Fi only (a/b/g)',
  'scan.issue.highUtil': 'High channel utilization',
  'scan.issue.dfs': 'DFS channel',
} as const;

export const scanIssueRuMessages: Record<ScanIssueMessageKey, string> = {
  'scan.issue.width40on24': '40 МГц и шире на 2,4 ГГц',
  'scan.issue.overlap24': 'Нестандартный канал 2,4 ГГц',
  'scan.issue.crowdedChannel': 'Загруженный канал',
  'scan.issue.lowSignal': 'Слабый сигнал',
  'scan.issue.lowSnr': 'Низкий SNR',
  'scan.issue.weakSecurity': 'Слабая защита',
  'scan.issue.hiddenSsid': 'Скрытое имя сети',
  'scan.issue.legacyOnly': 'Только legacy Wi‑Fi (a/b/g)',
  'scan.issue.highUtil': 'Высокая загрузка канала',
  'scan.issue.dfs': 'Канал DFS',
};

import type { ScanIssueId, ScanIssueMessageKey } from '../types';

export type { ScanIssueMessageKey };

export function scanIssueMessageKey(id: ScanIssueId): ScanIssueMessageKey {
  return `scan.issue.${id}`;
}
