/**
 * Безопасность BSS.
 *
 * У `CWNetwork` нет одного свойства `security` — только
 * `supportsSecurity:(CWSecurity)`. Собираем множество флагов опросом
 * всех известных значений. У `CWInterface.security` — тип **ассоциированного**
 * линка, не каждой строки скана.
 *
 * WPA/RSN IE: отдельный намёк, если `informationElementData` доступен
 * и разобран поверхностно (теги 48 / 221-WPA). Глубокий разбор AKM/cipher
 * suite — computed-approximation; полный 802.11w/R/K/FILS — unsupported.
 */

/** Соответствует `CWSecurity` (английские имена). */
export type SecurityKind =
  | 'open'
  | 'wep'
  | 'wpa-personal'
  | 'wpa-personal-mixed'
  | 'wpa2-personal'
  | 'wpa3-personal'
  | 'wpa3-transition'
  | 'personal-generic'
  | 'dynamic-wep'
  | 'wpa-enterprise'
  | 'wpa-enterprise-mixed'
  | 'wpa2-enterprise'
  | 'wpa3-enterprise'
  | 'enterprise-generic'
  | 'owe'
  | 'owe-transition'
  | 'unknown';

/** Класс для фильтра open/secure. */
export type SecurityAuthClass = 'open' | 'enhanced-open' | 'personal' | 'enterprise' | 'unknown';

export type RsnHint = 'none' | 'wpa-ie' | 'rsn-ie' | 'both' | 'unparsed';

export interface SecurityView {
  /** Все `supportsSecurity:` === YES. */
  flags: readonly SecurityKind[];
  /**
   * Один ярлык для таблицы: сильнейший / transition, если оба WPA2+WPA3.
   * Не выдумывать WPA3, если флага нет.
   */
  primary: SecurityKind;
  authClass: SecurityAuthClass;
  /** Только Open System (`kCWSecurityNone`). OWE — не open. */
  isOpen: boolean;
  /** personal | enterprise | enhanced-open. */
  isSecure: boolean;
  /** Поверхностный разбор IE, если байты есть. */
  ieHint: RsnHint;
}

/**
 * Приоритет primary (высокий индекс побеждает), если несколько флагов.
 * Transition держать выше «чистого» WPA2, если оба присутствуют.
 */
export const SECURITY_PRIMARY_RANK: readonly SecurityKind[] = [
  'unknown',
  'open',
  'wep',
  'dynamic-wep',
  'personal-generic',
  'wpa-personal',
  'wpa-personal-mixed',
  'wpa2-personal',
  'owe-transition',
  'owe',
  'wpa3-transition',
  'wpa3-personal',
  'enterprise-generic',
  'wpa-enterprise',
  'wpa-enterprise-mixed',
  'wpa2-enterprise',
  'wpa3-enterprise',
];
