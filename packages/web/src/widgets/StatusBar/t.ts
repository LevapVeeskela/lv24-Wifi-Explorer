type Values = Record<string, string | number>;

const RU: Record<string, string> = {
  'scan.status.timescaleHint': 'Сигнал · ↑/↓ меняют шкалу времени, когда фокус на графике',
  'scan.status.shortcutsHint':
    '⌘F поиск · ⌘P пауза скана · ⌘1–4 сведения · ⌘C BSSID при фокусе в таблице',
  'scan.status.found': 'Сетей: {count}',
  'scan.status.displayed': 'Показано: {count}',
  'scan.status.selected': 'Выбрано: {count}',
  'scan.status.annotations': 'Аннотаций: {count}',
  'scan.status.quality': 'Качество сигнала: {quality}',
  'scan.quality.excellent': 'Отличное',
  'scan.quality.good': 'Хорошее',
  'scan.quality.fair': 'Среднее',
  'scan.quality.poor': 'Слабое',
  'scan.quality.unusable': 'Непригодно',
  'scan.quality.none': 'Нет',
  'scan.status.scanCore': 'ScanCore: {state}',
  'scan.status.location': 'Геолокация: {state}',
  'scan.status.lastScan': 'Последнее: {time}',
  'scan.status.version': 'v{version}',
  'scan.status.about': 'О программе',
  'scan.scanCore.ok': 'ок',
  'scan.scanCore.error': 'ошибка',
  'scan.scanCore.demo': 'демо',
  'scan.location.granted': 'разрешена',
  'scan.location.denied': 'нет',
};

function interpolate(template: string, values?: Values): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

export function t(key: string, values?: Values): string {
  return interpolate(RU[key] ?? key, values);
}
