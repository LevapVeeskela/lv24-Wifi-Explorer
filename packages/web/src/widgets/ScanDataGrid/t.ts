/** Local ru catalog. i18n agent owns message files; keys stay `scan.*`. */

type Values = Record<string, string | number>;

const RU: Record<string, string> = {
  'scan.col.bssid': 'BSSID',
  'scan.col.ssid': 'Имя сети',
  'scan.col.vendor': 'Производитель',
  'scan.col.annotation': 'Пометки',
  'scan.col.issues': 'Проблемы',
  'scan.col.signal': 'Сигнал',
  'scan.col.signalTrend': 'Тренд',
  'scan.col.channel': 'Канал',
  'scan.col.channelWidth': 'Ширина канала',
  'scan.col.band': 'Диапазон',
  'scan.col.phyMode': 'Режим',
  'scan.col.rssi': 'RSSI',
  'scan.col.noise': 'Шум',
  'scan.col.snr': 'ОСШ',
  'scan.col.security': 'Защита',
  'scan.col.type': 'Тип',
  'scan.col.seen': 'Недавно',
  'scan.col.unii': 'UNII',
  'scan.col.firstSeen': 'Впервые',
  'scan.col.uptime': 'В сети',
  'scan.col.centerFreq': 'Центр. частота',
  'scan.col.maxRate': 'Макс. скорость',
  'scan.col.streams': 'Потоки',
  'scan.col.amendments': 'Поправки',
  'scan.col.generation': 'Поколение',
  'scan.col.country': 'Страна',
  'scan.col.beaconInterval': 'Интервал beacon',
  'scan.col.dtim': 'DTIM',
  'scan.col.bssLoad': 'Загрузка BSS',
  'scan.col.channelUtil': 'Загрузка канала',
  'scan.col.ieCount': 'IE',
  'scan.col.ieBytes': 'Байты IE',
  'scan.col.wps': 'WPS',
  'scan.col.mfp': 'MFP',
  'scan.col.ft': 'Быстрый переход',
  'scan.ssid.hidden': '‹скрытая›',
  'scan.quality.excellent': 'Отличное',
  'scan.quality.good': 'Хорошее',
  'scan.quality.fair': 'Среднее',
  'scan.quality.poor': 'Слабое',
  'scan.quality.unusable': 'Непригодно',
  'scan.quality.weak': 'Слабое',
  'scan.quality.none': 'Нет',
  'scan.type.infrastructure': 'Инфраструктура',
  'scan.type.ibss': 'Ad-hoc',
  'scan.grid.empty': 'Сети не найдены',
  'scan.grid.demo': 'Демо-режим: нет сетей для таблицы',
  'scan.grid.locationDenied': 'Нужно разрешение геолокации, чтобы видеть имена сетей',
  'scan.grid.emptyFilter': 'Нет сетей по фильтрам',
  'scan.grid.openLocationSettings': 'Открыть настройки',
  'scan.a11y.connected': 'Подключённая сеть',
};

function interpolate(template: string, values?: Values): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

export function t(key: string, values?: Values): string {
  return interpolate(RU[key] ?? key, values);
}
