type Values = Record<string, string | number>;

const RU: Record<string, string> = {
  'scan.title.scanning': 'Сканирование',
  'scan.title.paused': 'Пауза',
  'scan.title.demo': 'Демо',
  'scan.status.about': 'О программе',
  'scan.file.menu': 'Файл',
  'scan.file.open': 'Открыть снимок…',
  'scan.file.save': 'Сохранить снимок…',
  'scan.export.csv': 'Экспорт CSV',
  'scan.export.visible': 'Видимые строки',
  'scan.export.selected': 'Выделенные строки',
  'scan.export.all': 'Все строки',
  'scan.a11y.theme': 'Тема',
  'scan.a11y.scanToggle': 'Запуск и пауза сканирования',
};

function interpolate(template: string, values?: Values): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

export function t(key: string, values?: Values): string {
  return interpolate(RU[key] ?? key, values);
}
