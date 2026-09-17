/**
 * Снимок скана и то, чего macOS без monitor mode не отдаёт.
 *
 * Источник: `CWInterface.scanForNetworksWithSSID:includeHidden:error:`
 * (блокирующий) или `cachedScanResults`. Событие `CWEventTypeScanCacheUpdated`
 * — повод перечитать кэш, не спектр.
 */

import type { AssociatedLink, ObservedBss } from './bss';
import type { EssGroup } from './ess';
import type { IsoTime, LocationAuthorization } from './identity';

export interface ScanSnapshot {
  capturedAt: IsoTime;
  interfaceName: string | null;
  location: LocationAuthorization;
  /** Сети этого цикла (ещё не смерженные с историей). */
  networks: readonly ObservedBss[];
  associated: AssociatedLink | null;
  includeHiddenRequested: boolean;
}

/** Таблица после merge истории + группировки + фильтров. */
export interface ScanViewModel {
  snapshot: ScanSnapshot;
  bssRows: readonly ObservedBss[];
  essGroups: readonly EssGroup[];
  filteredBssRows: readonly ObservedBss[];
  filteredEssGroups: readonly EssGroup[];
}

export type UnsupportedReason =
  | 'needs-monitor-mode'
  | 'needs-specialized-radio'
  | 'os-privacy'
  | 'not-in-corewlan';

export interface UnsupportedCapability {
  id: string;
  reason: UnsupportedReason;
  notesRu: string;
}

/**
 * Явный список «не обещать в UI как факт».
 * Spectrum / utilization / клиенты / глубокий IE — не CoreWLAN scan.
 */
export const UNSUPPORTED_WITHOUT_MONITOR: readonly UnsupportedCapability[] = [
  {
    id: 'spectrum-fft',
    reason: 'needs-specialized-radio',
    notesRu:
      'Истинный спектр / FFT / PSD. Обычный клиентский Wi-Fi чип и CoreWLAN этого не дают.',
  },
  {
    id: 'channel-utilization',
    reason: 'needs-monitor-mode',
    notesRu:
      'CCA / airtime / % занятости канала. Нет в CWNetwork. Нельзя честно посчитать из RSSI соседних BSS.',
  },
  {
    id: 'per-bss-airtime',
    reason: 'needs-monitor-mode',
    notesRu: 'Доля эфира конкретной BSSID — только из захвата кадров.',
  },
  {
    id: 'associated-sta-list',
    reason: 'not-in-corewlan',
    notesRu:
      'Список клиентов чужой AP. Public CoreWLAN не отдаёт. Не парсить чужие Association.',
  },
  {
    id: 'per-packet-mcs',
    reason: 'needs-monitor-mode',
    notesRu:
      'MCS/NSS/GI/retry/CRC текущего кадра BSS. supportsPHYMode — только реклама возможности.',
  },
  {
    id: 'hidden-ie-deep-parse',
    reason: 'os-privacy',
    notesRu:
      'Глубокий разбор IE (RNR, FILS, vendor, 320 MHz EHT). Буфер часто обрезан; полный radiotap — monitor mode.',
  },
  {
    id: 'true-overlap-interference',
    reason: 'needs-monitor-mode',
    notesRu:
      'Реальная интерференция перекрывающихся BSS ≠ «сколько сетей на канале».',
  },
  {
    id: 'dfs-radar',
    reason: 'not-in-corewlan',
    notesRu: 'События DFS radar detection для чужих AP недоступны.',
  },
  {
    id: 'channel-80plus80',
    reason: 'not-in-corewlan',
    notesRu: 'CWChannelWidth не содержит 80+80.',
  },
  {
    id: 'channel-320mhz',
    reason: 'not-in-corewlan',
    notesRu: 'EHT 320 МГц нет в CWChannelWidth; не угадывать.',
  },
  {
    id: 'bt-zigbee-overlay',
    reason: 'needs-specialized-radio',
    notesRu:
      'Соседние технологии на 2.4 ГГц. CWEventTypeBtCoexStats — не спектр эфира.',
  },
  {
    id: 'remote-sensor',
    reason: 'not-in-corewlan',
    notesRu: 'Удалённые сенсоры / другой Mac как probe — вне v1.',
  },
];
