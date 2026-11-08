type Values = Record<string, string | number>;

const RU: Record<string, string> = {
  'scan.a11y.skipToGrid': 'К таблице',
  'scan.a11y.skipToDetails': 'К сведениям',
  'scan.a11y.splitterMain': 'Изменить размер таблицы и сведений',
  'scan.snapshot.openError': 'Не удалось открыть снимок: {detail}',
};

function interpolate(template: string, values?: Values): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

export function t(key: string, values?: Values): string {
  return interpolate(RU[key] ?? key, values);
}
