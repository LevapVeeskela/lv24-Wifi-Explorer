/**
 * Матрица доступности полей: API CoreWLAN / derived / approximation / unsupported.
 *
 * «API» = есть на `CWNetwork` / `CWChannel` / `CWInterface` после скана
 * (часть — только при Location). «derived» = детерминированная формула
 * из API. «computed-approximation» = оценка с оговоркой. «local-registry»
 * = файл IEEE OUI. «unsupported» = не обещать как факт на современном
 * macOS без monitor mode / спецрадио.
 */

export type FieldSource =
  | 'api'
  | 'derived'
  | 'computed-approximation'
  | 'local-registry'
  | 'unsupported';

export type FieldSubject = 'bss' | 'ess' | 'interface' | 'scan';

export interface FieldAvailabilityRow {
  field: string;
  subject: FieldSubject;
  source: FieldSource;
  corewlan: string | null;
  locationGated: boolean;
  notesRu: string;
}

export const FIELD_AVAILABILITY: readonly FieldAvailabilityRow[] = [
  // --- идентичность / группировка ---
  {
    field: 'ssid',
    subject: 'bss',
    source: 'api',
    corewlan: 'CWNetwork.ssid / ssidData',
    locationGated: true,
    notesRu: 'UTF-8/WinLatin1 или октеты 0–32. Без Location — nil.',
  },
  {
    field: 'bssid',
    subject: 'bss',
    source: 'api',
    corewlan: 'CWNetwork.bssid',
    locationGated: true,
    notesRu: 'XX:XX:XX:XX:XX:XX. Без Location скан не содержит BSSID.',
  },
  {
    field: 'essGroup / same-SSID many-BSSID',
    subject: 'ess',
    source: 'derived',
    corewlan: null,
    locationGated: true,
    notesRu: 'Группировка по ssidData. Скрытые SSID не сливать. IBSS отдельно.',
  },
  {
    field: 'ibss',
    subject: 'bss',
    source: 'api',
    corewlan: 'CWNetwork.ibss',
    locationGated: false,
    notesRu: 'Ad-hoc / independent BSS.',
  },

  // --- сигнал ---
  {
    field: 'rssi',
    subject: 'bss',
    source: 'api',
    corewlan: 'CWNetwork.rssiValue',
    locationGated: false,
    notesRu: 'dBm. Замер на момент последнего beacon/probe в кэше.',
  },
  {
    field: 'noise',
    subject: 'bss',
    source: 'api',
    corewlan: 'CWNetwork.noiseMeasurement',
    locationGated: false,
    notesRu: 'dBm. 0 часто «нет замера» — отбрасывать.',
  },
  {
    field: 'snr',
    subject: 'bss',
    source: 'derived',
    corewlan: null,
    locationGated: false,
    notesRu: 'rssi − noise. Только при валидном noise.',
  },
  {
    field: 'quality label',
    subject: 'bss',
    source: 'computed-approximation',
    corewlan: null,
    locationGated: false,
    notesRu: 'Эвристика SNR (иначе RSSI). Не процент и не стандарт IEEE.',
  },

  // --- канал ---
  {
    field: 'channel.number',
    subject: 'bss',
    source: 'api',
    corewlan: 'CWChannel.channelNumber',
    locationGated: false,
    notesRu: 'Primary channel.',
  },
  {
    field: 'channel.band',
    subject: 'bss',
    source: 'api',
    corewlan: 'CWChannel.channelBand',
    locationGated: false,
    notesRu: 'unknown / 2 / 5 / 6 ГГц → BandGhz 2.4 | 5 | 6.',
  },
  {
    field: 'channel.width',
    subject: 'bss',
    source: 'api',
    corewlan: 'CWChannel.channelWidth',
    locationGated: false,
    notesRu: '20/40/80/160 или unknown. Нет 80+80 и 320.',
  },
  {
    field: 'channel.primaryCenterMhz',
    subject: 'bss',
    source: 'derived',
    corewlan: null,
    locationGated: false,
    notesRu: 'IEEE: 2.4=2407+5n (14=2484); 5=5000+5n; 6=5950+5n. Центр 20 МГц.',
  },
  {
    field: 'channel.occupyingCenterMhz',
    subject: 'bss',
    source: 'computed-approximation',
    corewlan: null,
    locationGated: false,
    notesRu: 'При width>20 без HT/VHT/HE Operation — стандартные блоки, не факт CCFS.',
  },

  // --- безопасность / PHY ---
  {
    field: 'security flags',
    subject: 'bss',
    source: 'api',
    corewlan: 'CWNetwork.supportsSecurity:',
    locationGated: false,
    notesRu:
      'Множество CWSecurity, не одно свойство. У интерфейса есть .security только для association.',
  },
  {
    field: 'security.primary / open|secure',
    subject: 'bss',
    source: 'derived',
    corewlan: null,
    locationGated: false,
    notesRu: 'Ранжирование флагов. open = только None. OWE = secure.',
  },
  {
    field: 'wpa / rsn detail',
    subject: 'bss',
    source: 'computed-approximation',
    corewlan: 'CWNetwork.informationElementData',
    locationGated: false,
    notesRu: 'Теги 48 и 221-WPA, если буфер есть. Полная матрица AKM/cipher — не обещать.',
  },
  {
    field: 'phy modes / PHY string',
    subject: 'bss',
    source: 'api',
    corewlan: 'CWNetwork.supportsPHYMode:',
    locationGated: false,
    notesRu: 'Рекламируемые a/b/g/n/ac/ax/be. Не MCS текущего кадра. display = join флагов.',
  },
  {
    field: 'max rate estimate',
    subject: 'bss',
    source: 'computed-approximation',
    corewlan: null,
    locationGated: false,
    notesRu: 'Потолок 1 SS + long GI по PHY×width. Не link speed. High только при NSS из IE.',
  },

  // --- прочие API поля ---
  {
    field: 'countryCode',
    subject: 'bss',
    source: 'api',
    corewlan: 'CWNetwork.countryCode',
    locationGated: true,
    notesRu: 'ISO 3166-1 alpha-2 из beacon, если OS отдаёт.',
  },
  {
    field: 'beaconInterval',
    subject: 'bss',
    source: 'api',
    corewlan: 'CWNetwork.beaconInterval',
    locationGated: false,
    notesRu: 'мс, типично 100.',
  },
  {
    field: 'informationElementData',
    subject: 'bss',
    source: 'api',
    corewlan: 'CWNetwork.informationElementData',
    locationGated: false,
    notesRu: 'Может быть nil/обрезан. Сырые байты = API; глубокий parse = unsupported.',
  },
  {
    field: 'ie shallow tags',
    subject: 'bss',
    source: 'computed-approximation',
    corewlan: 'CWNetwork.informationElementData',
    locationGated: false,
    notesRu: 'TLV id/len + известные теги. См. IeParseLevel.',
  },

  // --- вендор / время ---
  {
    field: 'vendor / OUI',
    subject: 'bss',
    source: 'local-registry',
    corewlan: null,
    locationGated: true,
    notesRu:
      'Первые 3 октета BSSID → локальный IEEE MA-L. Randomized MAC — без организации. MA-M/MA-S неоднозначны.',
  },
  {
    field: 'rssiHistory[]',
    subject: 'bss',
    source: 'derived',
    corewlan: null,
    locationGated: false,
    notesRu: 'Наши точки по циклам скана, не история AP.',
  },
  {
    field: 'lastSeen / firstSeen / presence',
    subject: 'bss',
    source: 'derived',
    corewlan: null,
    locationGated: false,
    notesRu: 'lastSeen = наш snapshot. stale/disappeared — пропуски скана, не «AP выключили».',
  },

  // --- фильтры (потребители полей выше) ---
  {
    field: 'filter.band',
    subject: 'scan',
    source: 'derived',
    corewlan: 'CWChannel.channelBand',
    locationGated: false,
    notesRu: '2.4 / 5 / 6 из нормализованной полосы.',
  },
  {
    field: 'filter.open/secure',
    subject: 'scan',
    source: 'derived',
    corewlan: 'supportsSecurity:',
    locationGated: false,
    notesRu: 'open = None; secure = PSK/802.1X/OWE.',
  },
  {
    field: 'filter.ssid search',
    subject: 'scan',
    source: 'derived',
    corewlan: 'ssid',
    locationGated: true,
    notesRu: 'Подстрока displayName, case-insensitive.',
  },
  {
    field: 'filter.vendor',
    subject: 'scan',
    source: 'local-registry',
    corewlan: null,
    locationGated: true,
    notesRu: 'Подстрока organization или OUI.',
  },
  {
    field: 'filter.min signal',
    subject: 'scan',
    source: 'derived',
    corewlan: 'rssiValue / noiseMeasurement',
    locationGated: false,
    notesRu: 'minRssiDbm и/или minSnrDb.',
  },

  // --- ассоциированный интерфейс (не строка скана) ---
  {
    field: 'interface.transmitRate',
    subject: 'interface',
    source: 'api',
    corewlan: 'CWInterface.transmitRate',
    locationGated: false,
    notesRu: 'Фактический Mbps только своего линка.',
  },
  {
    field: 'interface.activePHYMode',
    subject: 'interface',
    source: 'api',
    corewlan: 'CWInterface.activePHYMode',
    locationGated: false,
    notesRu: 'Текущий PHY своего линка, не чужих BSS.',
  },
  {
    field: 'interface.transmitPower',
    subject: 'interface',
    source: 'api',
    corewlan: 'CWInterface.transmitPower',
    locationGated: false,
    notesRu: 'мВт своего радио.',
  },

  // --- unsupported (якоря матрицы; полный список — UNSUPPORTED_WITHOUT_MONITOR) ---
  {
    field: 'spectrum / FFT / PSD',
    subject: 'scan',
    source: 'unsupported',
    corewlan: null,
    locationGated: false,
    notesRu: 'Нужен спектроанализатор / спецрадио, не CoreWLAN.',
  },
  {
    field: 'per-channel utilization / CCA',
    subject: 'scan',
    source: 'unsupported',
    corewlan: null,
    locationGated: false,
    notesRu: 'Monitor mode / firmware CCA. Не выводить из числа BSS.',
  },
  {
    field: 'hidden IE deep parse',
    subject: 'bss',
    source: 'unsupported',
    corewlan: 'informationElementData (partial)',
    locationGated: false,
    notesRu: 'RNR/FILS/vendor/EHT-320. OS часто режет буфер.',
  },
  {
    field: 'STA clients / airtime / per-packet MCS',
    subject: 'bss',
    source: 'unsupported',
    corewlan: null,
    locationGated: false,
    notesRu: 'Только захват кадров. v1 не обещает.',
  },
] as const;
