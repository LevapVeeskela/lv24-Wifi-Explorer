type Values = Record<string, string | number>;

const RU: Record<string, string> = {
  'scan.settings.columns.profile.default': 'По умолчанию',
  'scan.settings.columns.profiles.hint':
    'Профили сохраняют набор видимых колонок. Переключение применяет профиль к таблице.',
  'scan.settings.columns.profiles.label': 'Профиль колонок',
  'scan.settings.columns.profiles.newName': 'Имя нового профиля',
  'scan.settings.columns.profiles.saveAs': 'Сохранить как',
  'scan.settings.columns.profiles.updateActive': 'Обновить профиль текущей видимостью',
  'scan.settings.columns.profiles.delete': 'Удалить профиль',
};

function interpolate(template: string, values?: Values): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

export function t(key: string, values?: Values): string {
  return interpolate(RU[key] ?? key, values);
}
