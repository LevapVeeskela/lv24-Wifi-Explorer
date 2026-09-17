type Values = Record<string, string | number>;

const RU: Record<string, string> = {
  'scan.filter.band': 'Фильтр диапазона',
  'scan.filter.band.all': 'Все',
  'scan.filter.band.24': '2,4 ГГц',
  'scan.filter.band.5': '5 ГГц',
  'scan.filter.band.6': '6 ГГц',
  'scan.filter.secure': 'Защита',
  'scan.filter.open': 'Открытые',
  'scan.filter.minRssi': 'Мин. RSSI',
  'scan.search.placeholder': 'Фильтр сетей',
  'scan.search.clear': 'Очистить поиск',
  'scan.col.vendor': 'Производитель',
  'scan.columns.manage': 'Колонки',
  'scan.export.csv': 'Экспорт CSV',
  'scan.export.visible': 'Видимые строки',
  'scan.export.selected': 'Выделенные строки',
  'scan.export.all': 'Все строки',
};

function interpolate(template: string, values?: Values): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

export function t(key: string, values?: Values): string {
  return interpolate(RU[key] ?? key, values);
}
