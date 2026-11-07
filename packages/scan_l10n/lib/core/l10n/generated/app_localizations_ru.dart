// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Russian (`ru`).
class AppLocalizationsRu extends AppLocalizations {
  AppLocalizationsRu([String locale = 'ru']) : super(locale);

  @override
  String get permissionsDeniedBody =>
      'SSID и BSSID остаются скрытыми, пока вы не разрешите службы геолокации для этого приложения. RF-показатели могут обновляться.';

  @override
  String get permissionsDeniedTitle => 'Имена сетей скрыты';

  @override
  String get permissionsLocationBody =>
      'В macOS имена Wi‑Fi сетей (SSID) и аппаратные адреса (BSSID) считаются данными, связанными с местоположением. LV24 WiFi Explorer запрашивает доступ к геолокации только для этих полей — без отслеживания GPS и без карт.';

  @override
  String get permissionsLocationSettingsHint =>
      'Включите службы геолокации в системе, затем отметьте LV24 WiFi Explorer в «Системные настройки → Конфиденциальность и безопасность → Службы геолокации».';

  @override
  String get permissionsLocationTitle => 'Службы геолокации';

  @override
  String get permissionsOnboardingBody =>
      'При активном сканировании без геолокации доступны уровень сигнала и каналы. Чтобы видеть имена сетей и MAC-адреса, разрешите доступ при запросе системы.';

  @override
  String get permissionsOnboardingTitle => 'Идентификация Wi‑Fi в macOS';

  @override
  String get permissionsOpenSettings => 'Открыть настройки геолокации';

  @override
  String get permissionsRestrictedBody =>
      'Политика устройства блокирует службы геолокации. Доступны данные только по RF или демо-режим, если он включён.';

  @override
  String get permissionsRestrictedTitle => 'Геолокация ограничена';

  @override
  String get onboardingLocationContinue => 'Продолжить';

  @override
  String get onboardingLocationLater => 'Не сейчас';

  @override
  String get onboardingLocationRetry => 'Повторить';

  @override
  String get permissionsPlatformAndroidBody =>
      'На Android результаты Wi‑Fi сканирования считаются данными о местоположении. WifiManager требует Location (и Nearby Wi‑Fi devices на Android 13+). ОС ограничивает startScan; это не уровень macOS ScanCore.';

  @override
  String get permissionsPlatformAndroidSettingsHint =>
      'Включите геолокацию, выдайте разрешение приложению и держите Wi‑Fi включенным. Пустые или устаревшие строки обычно значат throttle со стороны ОС.';

  @override
  String get permissionsPlatformAndroidTitle =>
      'Android: геолокация открывает WifiManager';

  @override
  String get permissionsPlatformIosBody =>
      'У сторонних приложений на iOS нет публичного API уровня CoreWLAN. Клиент может показать подключенную сеть, если Location When In Use открывает идентификаторы Wi‑Fi — это не обзор всех соседних точек.';

  @override
  String get permissionsPlatformIosSettingsHint =>
      'Настройки → Конфиденциальность и безопасность → Службы геолокации → При использовании. Без разрешения SSID и BSSID остаются скрытыми.';

  @override
  String get permissionsPlatformIosTitle => 'iOS не умеет полное сканирование';

  @override
  String get permissionsPlatformLinuxBody =>
      'Живые строки на Linux приходят из NetworkManager GetAccessPoints по публичному D-Bus — не iw и не monitor mode. На части рабочих столов SSID прячут, пока не разрешите location или geoclue.';

  @override
  String get permissionsPlatformLinuxSettingsHint =>
      'Разрешите геолокацию или geoclue, если портал спрашивает. Иначе может остаться только подключенная сеть или демо-фикстуры.';

  @override
  String get permissionsPlatformLinuxTitle =>
      'Linux: публичный D-Bus NetworkManager';

  @override
  String get permissionsPlatformMacosBody =>
      'В macOS SSID и BSSID закрыты CoreLocation. LV24 запрашивает доступ «При использовании» только чтобы live ScanCore открыл эти поля — без GPS и карт.';

  @override
  String get permissionsPlatformMacosSettingsHint =>
      'Включите службы геолокации, отметьте LV24 WiFi Explorer (и ScanCore, если запускаете отдельно). Нужен подписанный live ScanCore; ad-hoc или без подписи уходит в демо-фикстуры.';

  @override
  String get permissionsPlatformMacosTitle => 'Идентификация Wi‑Fi в macOS';

  @override
  String get permissionsPlatformOtherBody =>
      'Эта сборка не обещает активный скан уровня macOS. SSID и BSSID могут требовать разрешение геолокации; иначе остаются RF-поля, ассоциированное соединение или демо-фикстуры.';

  @override
  String get permissionsPlatformOtherSettingsHint =>
      'Откройте системные настройки геолокации, если ОС спрашивает. Windows v1 — ассоциированное соединение и демо-фикстуры, не обзор соседних BSS.';

  @override
  String get permissionsPlatformOtherTitle => 'Ограничения геолокации и скана';

  @override
  String get permissionsPlatformWindowsBody =>
      'Windows v1 берет ассоциированное соединение через Native Wifi WlanQueryInterface. Это не обзор соседних BSS. Разрешение геолокации может открыть идентификаторы Wi‑Fi, но не превращает клиент в site survey.';

  @override
  String get permissionsPlatformWindowsSettingsHint =>
      'Если Windows просит геолокацию для текущего SSID или BSSID, разрешите. Без ассоциации остаются демо-фикстуры.';

  @override
  String get permissionsPlatformWindowsTitle =>
      'Windows: только подключенная сеть';

  @override
  String get scanDegradedAndroidThrottledBody =>
      'WifiManager ограничил этот скан (throttle ОС или SCAN_FAILED). Данные могут быть устаревшими; следующая попытка не раньше чем через 30 с.';

  @override
  String get scanDegradedAndroidThrottledTitle =>
      'Android: сканирование ограничено';

  @override
  String get scanDegradedDemoBody =>
      'Живой скан не запущен. macOS нужны Location When In Use и подписанный live ScanCore. iOS не умеет полный скан; Android WifiManager ограничен throttle; Linux использует публичный D-Bus NetworkManager; Windows — только ассоциированное соединение.';

  @override
  String get scanDegradedDemoTitle => 'Демоданные';

  @override
  String get scanDegradedIosConnectedOnlyBody =>
      'Публичного API для полного обзора соседних BSS на iOS нет. Показана ассоциированная сеть, если идентификаторы доступны.';

  @override
  String get scanDegradedIosConnectedOnlyTitle =>
      'iOS: только подключенная сеть';

  @override
  String get scanDegradedLinuxNmBody =>
      'Доступен только публичный D-Bus NetworkManager — часто лишь подключенная сеть. Это не полноценный RF-обзор.';

  @override
  String get scanDegradedLinuxNmTitle => 'Linux: только данные NetworkManager';

  @override
  String get scanDegradedWindowsConnectedOnlyBody =>
      'Native Wifi показывает подключенную сеть (SSID, BSSID, качество). Соседние BSS, канал и IE в этом v1-пути недоступны.';

  @override
  String get scanDegradedWindowsConnectedOnlyTitle =>
      'Windows: только подключенная сеть';

  @override
  String get scanDemoBanner =>
      'Демоданные — живой скан не запущен. macOS нужны Location When In Use и live ScanCore; iOS — только подключенная сеть; Android WifiManager с throttle; Linux — публичный D-Bus NetworkManager; Windows — только ассоциированное соединение.';

  @override
  String get scanAboutAttribution =>
      'UI: Material UI (MIT) · Data Grid Pro (коммерческая лицензия) · MUI X Charts (MIT).';

  @override
  String get scanAboutLocation =>
      'На современных версиях macOS для отображения SSID и BSSID может потребоваться служба геолокации. Приложение не использует GPS и не строит карты.';

  @override
  String get scanAboutScanCore =>
      'ScanCore · вспомогательный процесс активного сканирования CoreWLAN в macOS.';

  @override
  String get scanAboutTitle => 'LV24 WiFi Explorer';

  @override
  String get scanAdvIes => 'Информационные элементы';

  @override
  String get scanAdvIssues => 'Проблемы';

  @override
  String get scanAdvRadio => 'Радио';

  @override
  String get scanAdvSecurity => 'Защита';

  @override
  String get scanAdvIesTree => 'Информационные элементы — дерево';

  @override
  String get scanIeParseLevel => 'Уровень разбора';

  @override
  String get scanIeByteLength => 'Длина в байтах';

  @override
  String get scanIeElementCount => 'Число элементов';

  @override
  String get scanIeRawHex => 'Сырой hex';

  @override
  String get scanIeYes => 'да';

  @override
  String get scanIeNo => 'нет';

  @override
  String get scanIeHiddenValue => '(скрытый)';

  @override
  String get scanIeFlagSet => 'установлен';

  @override
  String get scanIeWpaIe => 'WPA IE';

  @override
  String get scanIeLevelAbsent => 'нет данных';

  @override
  String get scanIeLevelRawOnly => 'только сырые';

  @override
  String get scanIeLevelShallowTags => 'поверхностные теги';

  @override
  String get scanIeLevelUnsupportedDeep => 'глубокий разбор не поддерживается';

  @override
  String get scanIeSsid => 'SSID';

  @override
  String get scanIeHidden => 'Скрытая';

  @override
  String get scanIeRates => 'Скорости';

  @override
  String get scanIeBasicRates => 'Базовые скорости';

  @override
  String get scanIeChannel => 'Канал';

  @override
  String get scanIeCountryCode => 'Код страны';

  @override
  String get scanIeEnvironment => 'Среда';

  @override
  String scanIeRegulatoryTriplet(Object index) {
    return 'Регуляторная тройка $index';
  }

  @override
  String get scanIeStationCount => 'Число станций';

  @override
  String get scanIeChannelUtilization => 'Загрузка канала';

  @override
  String get scanIeAdmissionCapacity => 'Доступная ёмкость доступа';

  @override
  String get scanIeDtimCount => 'Счётчик DTIM';

  @override
  String get scanIeDtimPeriod => 'Период DTIM';

  @override
  String get scanIeBitmapControl => 'Управление битовой картой';

  @override
  String get scanIePartialBitmapLength => 'Длина частичной битовой карты';

  @override
  String get scanIeLocalPowerConstraint => 'Локальное ограничение мощности';

  @override
  String get scanIeSpatialStreams => 'Пространственные потоки';

  @override
  String get scanIeFortyMhz => '40 МГц';

  @override
  String get scanIeShortGi20 => 'Короткий GI 20 МГц';

  @override
  String get scanIeShortGi40 => 'Короткий GI 40 МГц';

  @override
  String get scanIeVersion => 'Версия';

  @override
  String get scanIeGroupCipher => 'Групповой шифр';

  @override
  String scanIePairwise(Object index) {
    return 'Парный $index';
  }

  @override
  String scanIeAkm(Object index) {
    return 'AKM $index';
  }

  @override
  String get scanIeMfpc => 'MFPC (PMF поддерживается)';

  @override
  String get scanIeMfpr => 'MFPR (PMF обязателен)';

  @override
  String get scanIePrimaryChannel => 'Основной канал';

  @override
  String get scanIeSecondaryOffset => 'Смещение вторичного';

  @override
  String get scanIeStaWidthAny40 => 'STA: любая ширина 40';

  @override
  String get scanIeMaxMcs => 'Макс. MCS';

  @override
  String get scanIeShortGi80 => 'Короткий GI 80 МГц';

  @override
  String get scanIeShortGi160 => 'Короткий GI 160 МГц';

  @override
  String get scanIeChannelWidthSet => 'Набор ширин канала';

  @override
  String get scanIeWidthCode => 'Код ширины канала';

  @override
  String get scanIeChannelWidth => 'Ширина канала';

  @override
  String get scanIeCcfs0 => 'Сегмент центр. частоты 0';

  @override
  String get scanIeCcfs1 => 'Сегмент центр. частоты 1';

  @override
  String get scanIeLength => 'Длина';

  @override
  String get scanIeOui => 'OUI';

  @override
  String get scanIeVendorType => 'Тип вендора';

  @override
  String get scanIeSaeH2e => 'SAE hash-to-element';

  @override
  String get scanIeMaxMcs80 => 'Макс. MCS (≤80 МГц)';

  @override
  String get scanIeBssColor => 'Цвет BSS';

  @override
  String get scanIeBssColorDisabled => 'Цвет BSS отключён';

  @override
  String get scanIeSixGhzPrimary => 'Основной канал 6 ГГц';

  @override
  String get scanColumnsManage => 'Колонки';

  @override
  String get scanColumnsReset => 'Сбросить колонки';

  @override
  String get scanCopied => 'Скопировано';

  @override
  String get scanCompareDiffLegend =>
      'Подсветка — значения различаются между выбранными сетями.';

  @override
  String get scanCompareField => 'Поле';

  @override
  String get scanCompareHint =>
      'Выберите 2–3 сети в таблице (флажки или ⌘-клик), затем сравните поля рядом.';

  @override
  String get scanChartEmpty => 'Пока нет данных';

  @override
  String get scanChartOccupancy => 'Занятость каналов';

  @override
  String get scanChartOccupancyHint =>
      'По данным активного сканирования, не RF-спектр';

  @override
  String get scanChartSelected => 'Выбранная сеть';

  @override
  String get scanChartSignal => 'История сигнала';

  @override
  String get scanChartTable => 'Таблица данных графика';

  @override
  String get scanChartTimescale => 'Шкала времени';

  @override
  String get scanChartUnitDbm => 'dBm';

  @override
  String get scanChartUnitPct => 'Проценты';

  @override
  String get scanColBand => 'Диапазон';

  @override
  String get scanColBssid => 'BSSID';

  @override
  String get scanColChannel => 'Канал';

  @override
  String get scanColChannelWidth => 'Ширина канала';

  @override
  String get scanColIssues => 'Проблемы';

  @override
  String get scanColPhyMode => 'Режим';

  @override
  String get scanColRssi => 'RSSI';

  @override
  String get scanColSecurity => 'Защита';

  @override
  String get scanColSsid => 'Имя сети';

  @override
  String get scanColVendor => 'Производитель';

  @override
  String get scanDetailsBand => 'Диапазон';

  @override
  String get scanDetailsBssid => 'BSSID';

  @override
  String get scanDetailsChannel => 'Канал';

  @override
  String get scanDetailsChannelWidth => 'Ширина канала';

  @override
  String get scanDetailsConnected => 'Подключено';

  @override
  String get scanDetailsCountry => 'Страна';

  @override
  String get scanDetailsEmpty => 'Выберите сеть';

  @override
  String get scanDetailsEncryption => 'Шифрование';

  @override
  String get scanDetailsFirstSeen => 'Впервые';

  @override
  String get scanDetailsFrequencyMHz => 'Частота';

  @override
  String get scanDetailsLastSeen => 'Последний раз';

  @override
  String get scanDetailsMaxRateMbps => 'Макс. скорость';

  @override
  String get scanDetailsNetworkType => 'Тип';

  @override
  String get scanDetailsNoiseDbm => 'Шум';

  @override
  String get scanDetailsPhyMode => 'Режим';

  @override
  String get scanDetailsSecurity => 'Защита';

  @override
  String get scanDetailsSignalPct => 'Сигнал';

  @override
  String get scanDetailsSignalQuality => 'Качество сигнала';

  @override
  String get scanDetailsSnrDb => 'ОСШ';

  @override
  String get scanDetailsSsid => 'SSID';

  @override
  String get scanDetailsVendor => 'Производитель';

  @override
  String get scanExportAll => 'Все строки';

  @override
  String get scanExportCsv => 'Экспорт CSV';

  @override
  String get scanExportSelected => 'Выделенные строки';

  @override
  String get scanExportVisible => 'Видимые строки';

  @override
  String get scanFieldUnavailable => 'Недоступно при активном скане';

  @override
  String get scanFileMenu => 'Файл';

  @override
  String get scanFileOpen => 'Открыть снимок…';

  @override
  String get scanFileSave => 'Сохранить снимок…';

  @override
  String get scanPrintVisible => 'Печать видимой таблицы…';

  @override
  String get scanFilterBand => 'Фильтр диапазона';

  @override
  String get scanFilterBand24 => '2,4 ГГц';

  @override
  String get scanFilterBand5 => '5 ГГц';

  @override
  String get scanFilterBand6 => '6 ГГц';

  @override
  String get scanFilterBandAll => 'Все';

  @override
  String get scanFilterBand6Empty => 'В этом скане нет сетей 6 ГГц';

  @override
  String get scanFilterMinRssi => 'Мин. RSSI';

  @override
  String get scanFilterOpen => 'Открытые';

  @override
  String get scanFilterSecure => 'Защищённые';

  @override
  String scanFilterSidebarChipCount(String label, int count) {
    return '$label ($count)';
  }

  @override
  String get scanFilterSidebarClear =>
      'Сбросить фильтры диапазона, защиты и производителя';

  @override
  String get scanFilterSidebarCollapse => 'Свернуть панель фильтров';

  @override
  String get scanFilterSidebarEmpty => 'Пока нет сетей для фильтрации.';

  @override
  String get scanFilterSidebarExpand => 'Развернуть панель фильтров';

  @override
  String get scanFilterSidebarSectionBand => 'Диапазон';

  @override
  String get scanFilterSidebarSectionSecurity => 'Защита';

  @override
  String get scanFilterSidebarSectionVendor => 'Производитель';

  @override
  String get scanFilterSidebarTitle => 'Фильтры';

  @override
  String get scanFilterSidebarVendorUnknown => 'Неизвестный производитель';

  @override
  String get scanIssueCrowdedChannel => 'Загруженный канал';

  @override
  String get scanIssueDfs => 'Канал DFS';

  @override
  String get scanIssueHiddenSsid => 'Скрытое имя сети';

  @override
  String get scanIssueHighUtil => 'Высокая загрузка канала';

  @override
  String get scanIssueLegacyOnly => 'Только legacy Wi‑Fi (a/b/g)';

  @override
  String get scanIssueLowSignal => 'Слабый сигнал';

  @override
  String get scanIssueLowSnr => 'Низкий SNR';

  @override
  String get scanIssueOverlap24 => 'Нестандартный канал 2,4 ГГц';

  @override
  String get scanIssueWeakSecurity => 'Слабая защита';

  @override
  String get scanIssueWidth40on24 => '40 МГц и шире на 2,4 ГГц';

  @override
  String get scanQualityExcellent => 'Отличное';

  @override
  String get scanQualityFair => 'Среднее';

  @override
  String get scanQualityGood => 'Хорошее';

  @override
  String get scanQualityPoor => 'Слабое';

  @override
  String get scanQualityUnusable => 'Непригодно';

  @override
  String get scanLocationDenied => 'нет';

  @override
  String get scanLocationGranted => 'разрешена';

  @override
  String get scanLocationNotDetermined => 'не запрошена';

  @override
  String get scanLocationRestricted => 'ограничена';

  @override
  String get scanScanCoreDemo => 'демо';

  @override
  String get scanScanCoreError => 'ошибка';

  @override
  String get scanScanCoreOk => 'ок';

  @override
  String get scanSearchClear => 'Очистить поиск';

  @override
  String get scanSearchPlaceholder => 'Фильтр сетей';

  @override
  String get scanSettingsOpen => 'Настройки сканирования';

  @override
  String get scanSettingsScanInterval => 'Интервал сканирования';

  @override
  String scanSettingsScanIntervalSec(Object sec) {
    return '$sec с';
  }

  @override
  String get scanSettingsSignalUnit => 'Отображение сигнала';

  @override
  String get scanSettingsSignalUnitDbm => 'dBm';

  @override
  String get scanSettingsSignalUnitPercent => 'Проценты';

  @override
  String get scanSettingsAutoStart => 'Запускать сканирование при старте';

  @override
  String get scanSettingsColumnsCellRules => 'Подсветка ячеек';

  @override
  String get scanSettingsColumnsCellRulesEnabled =>
      'Включить подсветку по правилам';

  @override
  String get scanSettingsColumnsCellRulesRssi =>
      'Качество сигнала (RSSI, SNR, шум)';

  @override
  String get scanSettingsColumnsCellRulesSecurity =>
      'Открытые и слабые сети (WEP)';

  @override
  String get scanSettingsColumnsOpenVisibility =>
      'Управление видимостью колонок…';

  @override
  String get scanSettingsTitle => 'Настройки сканирования';

  @override
  String get scanSettingsWindowTitle => 'Настройки LV24 WiFi Explorer';

  @override
  String get scanSettingsTabGeneral => 'Основные';

  @override
  String get scanSettingsTabColumns => 'Колонки';

  @override
  String get scanSettingsTabAnnotations => 'Пометки';

  @override
  String get scanSettingsTabVendor => 'База производителей';

  @override
  String get scanSettingsTabAdvanced => 'Дополнительно';

  @override
  String get scanSettingsIncludeHiddenSsid =>
      'Включать скрытые SSID при сканировании';

  @override
  String get scanSettingsDataSource => 'Источник данных';

  @override
  String get scanSettingsLiveScan => 'Живой скан';

  @override
  String get scanSettingsLanguage => 'Язык интерфейса';

  @override
  String get scanSettingsClose => 'Закрыть';

  @override
  String get scanSettingsAnnotationsAdd => 'Добавить правило';

  @override
  String get scanSettingsAnnotationsPattern => 'Шаблон BSSID';

  @override
  String get scanSettingsAnnotationsText => 'Текст';

  @override
  String get scanSettingsAnnotationsEmpty =>
      'Нет правил. Добавьте шаблон MAC или импортируйте CSV.';

  @override
  String get scanSettingsAnnotationsImport => 'Импорт CSV';

  @override
  String get scanSettingsAnnotationsExport => 'Экспорт CSV';

  @override
  String get scanSettingsAnnotationsRemove => 'Удалить';

  @override
  String get scanSettingsVendorBundled =>
      'В комплекте — локальная копия IEEE MA-L (24‑бит OUI).';

  @override
  String scanSettingsVendorEntries(Object count) {
    return 'Записей: $count';
  }

  @override
  String scanSettingsVendorUpdated(Object date) {
    return 'Обновлено: $date';
  }

  @override
  String get scanSettingsVendorRefreshHint =>
      'Обновление: yarn oui:refresh (публичный реестр IEEE, без сторонних API).';

  @override
  String get scanSettingsAdvancedHideEmptySpectrum =>
      'Скрывать пустые диапазоны на спектре';

  @override
  String get scanSettingsAdvancedGraphLabels => 'Подписи на графиках';

  @override
  String get scanSettingsAdvancedGraphLabelsSsid => 'Имя сети (SSID)';

  @override
  String get scanSettingsAdvancedGraphLabelsApName => 'Имя точки доступа';

  @override
  String get scanSettingsAdvancedGraphLabelsAnnotation => 'Пометка';

  @override
  String get scanSettingsAdvancedFollowSystem => 'Оформление как в системе';

  @override
  String scanSnapshotOpenError(Object detail) {
    return 'Не удалось открыть снимок: $detail';
  }

  @override
  String get scanSsidHidden => '‹скрытая›';

  @override
  String get scanStatusAbout => 'О программе';

  @override
  String scanStatusFound(Object count) {
    return 'Сетей: $count';
  }

  @override
  String scanStatusLastScan(Object time) {
    return 'Последнее: $time';
  }

  @override
  String scanStatusLocation(Object state) {
    return 'Геолокация: $state';
  }

  @override
  String scanStatusScanCore(Object state) {
    return 'ScanCore: $state';
  }

  @override
  String scanStatusSelected(Object count) {
    return 'Выбрано: $count';
  }

  @override
  String get scanStatusShortcutsHint =>
      '⌘F поиск · ⌘P пауза скана · ⌘1–4 сведения · ⌘C BSSID при фокусе в таблице';

  @override
  String get scanStatusTimescaleHint =>
      'Сигнал · ↑/↓ меняют шкалу времени, когда фокус на графике';

  @override
  String scanStatusVersion(Object version) {
    return 'v$version';
  }

  @override
  String get scanTypeIbss => 'Ad-hoc';

  @override
  String get scanTypeInfrastructure => 'Инфраструктура';

  @override
  String get scanTabAdvanced => 'Дополнительно';

  @override
  String get scanTabCompare => 'Сравнение';

  @override
  String get scanTabDetails => 'Сведения о сети';

  @override
  String get scanTabOccupancy => 'Занятость каналов';

  @override
  String get scanTabSignal => 'Уровень сигнала';

  @override
  String get scanTitleDemo => 'Демо';

  @override
  String get scanTitlePaused => 'Пауза';

  @override
  String get scanTitleScanning => 'Сканирование';
}
