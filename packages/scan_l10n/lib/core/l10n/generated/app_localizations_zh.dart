// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Chinese (`zh`).
class AppLocalizationsZh extends AppLocalizations {
  AppLocalizationsZh([String locale = 'zh']) : super(locale);

  @override
  String get permissionsDeniedBody =>
      'SSID 和 BSSID 将保持隐藏，直到你允许本应用使用定位服务。RF 指标仍可能更新。';

  @override
  String get permissionsDeniedTitle => '网络名称已隐藏';

  @override
  String get permissionsLocationBody =>
      '在 macOS 上，Wi‑Fi 网络名称（SSID）和硬件地址（BSSID）被视为与位置相关的数据。LV24 WiFi Explorer 请求定位服务仅用于解锁这些字段——不用于 GPS 定位跟踪或显示地图。';

  @override
  String get permissionsLocationSettingsHint =>
      '先全局开启定位服务，然后在“系统设置 → 隐私与安全性 → 定位服务”中启用 LV24 WiFi Explorer。';

  @override
  String get permissionsLocationTitle => '定位服务';

  @override
  String get permissionsOnboardingBody =>
      '主动扫描无需定位即可显示信号和信道。要列出网络名称和 MAC 地址，请在系统提示时允许定位。';

  @override
  String get permissionsOnboardingTitle => 'macOS 上的 Wi‑Fi 身份识别';

  @override
  String get permissionsOpenSettings => '打开定位设置';

  @override
  String get permissionsRestrictedBody =>
      '设备策略阻止了定位服务。你仍可查看仅 RF 的扫描数据，或在可用时使用演示模式。';

  @override
  String get permissionsRestrictedTitle => '定位受限';

  @override
  String get onboardingLocationContinue => '继续';

  @override
  String get onboardingLocationLater => '暂不';

  @override
  String get onboardingLocationRetry => '重试';

  @override
  String get permissionsPlatformAndroidBody =>
      'Android 将 Wi‑Fi 扫描结果视为与位置相关的数据。WifiManager 需要定位权限（Android 13+ 还需要“附近的 Wi‑Fi 设备”）。系统会限制 startScan 频率；这与 macOS ScanCore 的丰富程度不同。';

  @override
  String get permissionsPlatformAndroidSettingsHint =>
      '开启定位、向本应用授权，并保持 Wi‑Fi 开启。出现空白或过期的行通常意味着系统正在限流扫描。';

  @override
  String get permissionsPlatformAndroidTitle => 'Android 定位可解锁 WifiManager 结果';

  @override
  String get permissionsPlatformIosBody =>
      'Apple 不向第三方应用提供 CoreWLAN 式的完整扫描。当“使用 App 期间”定位允许 Wi‑Fi 身份识别时，本客户端可显示已连接的网络——而不是漫游站点勘测。';

  @override
  String get permissionsPlatformIosSettingsHint =>
      '设置 → 隐私与安全性 → 定位服务 → 使用 App 期间。没有该授权时 SSID 和 BSSID 保持隐藏。';

  @override
  String get permissionsPlatformIosTitle => 'iOS 无法扫描所有附近网络';

  @override
  String get permissionsPlatformLinuxBody =>
      'Linux 的实时数据来自 NetworkManager 通过公共 D-Bus 提供的 GetAccessPoints——不是 iw，也不是 monitor 模式。部分桌面还会在你允许定位或 geoclue 提示之前隐藏 SSID。';

  @override
  String get permissionsPlatformLinuxSettingsHint =>
      '如果门户询问，请允许定位或 geoclue。否则你可能只能看到已连接的网络或演示数据。';

  @override
  String get permissionsPlatformLinuxTitle => 'Linux NetworkManager 公共 D-Bus';

  @override
  String get permissionsPlatformMacosBody =>
      '在 macOS 上，SSID 和 BSSID 受 CoreLocation 保护。LV24 请求“使用 App 期间”定位，仅用于通过实时 ScanCore 助手解锁这些字段——不涉及 GPS 或地图。';

  @override
  String get permissionsPlatformMacosSettingsHint =>
      '开启定位服务，启用 LV24 WiFi Explorer（若单独运行 ScanCore 也要启用它），然后使用签名的实时 ScanCore。ad-hoc 或未签名的助手会回退到演示数据。';

  @override
  String get permissionsPlatformMacosTitle => 'macOS 上的 Wi‑Fi 身份识别';

  @override
  String get permissionsPlatformOtherBody =>
      '此版本无法保证 macOS 级别的主动扫描。SSID 和 BSSID 可能需要系统定位权限；否则你只能看到 RF 字段、关联链路或演示数据。';

  @override
  String get permissionsPlatformOtherSettingsHint =>
      '如果系统询问，请打开系统定位设置。Windows v1 使用关联链路加演示数据，而不是附近 BSS 勘测。';

  @override
  String get permissionsPlatformOtherTitle => '定位与扫描限制';

  @override
  String get permissionsPlatformWindowsBody =>
      'Windows v1 通过 Native Wifi 的 WlanQueryInterface 获取已连接的网络。没有公开的附近 BSS 勘测能力。定位可能解锁 Wi‑Fi 身份信息，但不会把它变成站点勘测。';

  @override
  String get permissionsPlatformWindowsSettingsHint =>
      '如果 Windows 为显示当前 SSID 或 BSSID 请求定位，请允许。未关联网络时显示演示数据。';

  @override
  String get permissionsPlatformWindowsTitle => 'Windows 仅关联链路';

  @override
  String get scanDegradedAndroidThrottledBody =>
      'WifiManager 限制了本次扫描（系统限流或 SCAN_FAILED）。结果可能过期；下次尝试将退避（30 秒或更久）。';

  @override
  String get scanDegradedAndroidThrottledTitle => 'Android 扫描受限';

  @override
  String get scanDegradedDemoBody =>
      '实时扫描未运行。macOS 需要“使用 App 期间”定位和签名版实时 ScanCore。iOS 无法完整扫描；Android WifiManager 受限流限制；Linux 使用公共 NetworkManager D-Bus；Windows 仅关联链路。';

  @override
  String get scanDegradedDemoTitle => '演示数据';

  @override
  String get scanDegradedIosConnectedOnlyBody =>
      'iOS 没有可完整扫描附近 BSS 的公共 API。在可获得身份信息时显示已关联的网络。';

  @override
  String get scanDegradedIosConnectedOnlyTitle => 'iOS 仅已连接网络';

  @override
  String get scanDegradedLinuxNmBody =>
      '仅有公共 NetworkManager D-Bus 数据可用——通常只是已连接的网络。这不是完整的 RF 勘测。';

  @override
  String get scanDegradedLinuxNmTitle => 'Linux NetworkManager 受限';

  @override
  String get scanDegradedWindowsConnectedOnlyBody =>
      'Native Wifi 报告已连接的网络（SSID、BSSID、质量）。在 v1 路径中无法获得附近 BSS、信道和 IE 信息。';

  @override
  String get scanDegradedWindowsConnectedOnlyTitle => 'Windows 仅关联链路';

  @override
  String get scanDemoBanner =>
      '演示数据——实时扫描未运行。macOS 需要“使用 App 期间”定位和实时 ScanCore；iOS 仅已连接网络；Android WifiManager 受限流限制；Linux 使用公共 NetworkManager D-Bus；Windows 仅关联链路。';

  @override
  String get scanAboutAttribution =>
      'UI：Material UI（MIT）· Data Grid Pro（商业许可）· MUI X Charts（MIT）。';

  @override
  String get scanAboutLocation =>
      '在现代 macOS 上，显示 SSID 和 BSSID 可能需要定位服务。本应用不使用 GPS 或地图跟踪。';

  @override
  String get scanAboutScanCore => 'ScanCore · macOS CoreWLAN 主动扫描助手。';

  @override
  String get scanAboutTitle => 'LV24 WiFi Explorer';

  @override
  String get scanAdvIes => '信息元素';

  @override
  String get scanAdvIssues => '问题';

  @override
  String get scanAdvRadio => '无线电';

  @override
  String get scanAdvSecurity => '安全';

  @override
  String get scanAdvIesTree => '信息元素 — 树状视图';

  @override
  String get scanIeParseLevel => '解析级别';

  @override
  String get scanIeByteLength => '字节长度';

  @override
  String get scanIeElementCount => '元素数量';

  @override
  String get scanIeRawHex => '原始十六进制';

  @override
  String get scanIeYes => '是';

  @override
  String get scanIeNo => '否';

  @override
  String get scanIeHiddenValue => '（隐藏）';

  @override
  String get scanIeFlagSet => '已设置';

  @override
  String get scanIeWpaIe => 'WPA IE';

  @override
  String get scanIeLevelAbsent => '缺失';

  @override
  String get scanIeLevelRawOnly => '仅原始数据';

  @override
  String get scanIeLevelShallowTags => '浅层标签';

  @override
  String get scanIeLevelUnsupportedDeep => '不支持的深层解析';

  @override
  String get scanIeSsid => 'SSID';

  @override
  String get scanIeHidden => '隐藏';

  @override
  String get scanIeRates => '速率';

  @override
  String get scanIeBasicRates => '基础速率';

  @override
  String get scanIeChannel => '信道';

  @override
  String get scanIeCountryCode => '国家代码';

  @override
  String get scanIeEnvironment => '环境';

  @override
  String scanIeRegulatoryTriplet(Object index) {
    return '监管三元组 $index';
  }

  @override
  String get scanIeStationCount => '站点数量';

  @override
  String get scanIeChannelUtilization => '信道利用率';

  @override
  String get scanIeAdmissionCapacity => '可用准入容量';

  @override
  String get scanIeDtimCount => 'DTIM 计数';

  @override
  String get scanIeDtimPeriod => 'DTIM 周期';

  @override
  String get scanIeBitmapControl => '位图控制';

  @override
  String get scanIePartialBitmapLength => '部分位图长度';

  @override
  String get scanIeLocalPowerConstraint => '本地功率限制';

  @override
  String get scanIeSpatialStreams => '空间流';

  @override
  String get scanIeFortyMhz => '40 MHz';

  @override
  String get scanIeShortGi20 => '短 GI 20 MHz';

  @override
  String get scanIeShortGi40 => '短 GI 40 MHz';

  @override
  String get scanIeVersion => '版本';

  @override
  String get scanIeGroupCipher => '组加密';

  @override
  String scanIePairwise(Object index) {
    return '成对加密 $index';
  }

  @override
  String scanIeAkm(Object index) {
    return 'AKM $index';
  }

  @override
  String get scanIeMfpc => 'MFPC（支持 PMF）';

  @override
  String get scanIeMfpr => 'MFPR（要求 PMF）';

  @override
  String get scanIePrimaryChannel => '主信道';

  @override
  String get scanIeSecondaryOffset => '次信道偏移';

  @override
  String get scanIeStaWidthAny40 => 'STA 信道宽度任意 40';

  @override
  String get scanIeMaxMcs => '最大 MCS';

  @override
  String get scanIeShortGi80 => '短 GI 80 MHz';

  @override
  String get scanIeShortGi160 => '短 GI 160 MHz';

  @override
  String get scanIeChannelWidthSet => '支持的信道宽度集';

  @override
  String get scanIeWidthCode => '信道宽度代码';

  @override
  String get scanIeChannelWidth => '信道宽度';

  @override
  String get scanIeCcfs0 => '中心频段 0';

  @override
  String get scanIeCcfs1 => '中心频段 1';

  @override
  String get scanIeLength => '长度';

  @override
  String get scanIeOui => 'OUI';

  @override
  String get scanIeVendorType => '厂商类型';

  @override
  String get scanIeSaeH2e => 'SAE 哈希到元素';

  @override
  String get scanIeMaxMcs80 => '最大 MCS（≤80 MHz）';

  @override
  String get scanIeBssColor => 'BSS 颜色';

  @override
  String get scanIeBssColorDisabled => 'BSS 颜色已禁用';

  @override
  String get scanIeSixGhzPrimary => '6 GHz 主信道';

  @override
  String get scanColumnsManage => '列';

  @override
  String get scanColumnsReset => '重置列';

  @override
  String get scanCopied => '已复制到剪贴板';

  @override
  String get scanCompareDiffLegend => '高亮单元格表示所选网络之间的差异。';

  @override
  String get scanCompareField => '字段';

  @override
  String get scanCompareHint => '在表格中选择 2–3 个网络（复选框或 ⌘-点击），然后并排查看各字段。';

  @override
  String get scanChartEmpty => '尚无样本';

  @override
  String get scanChartOccupancy => '信道占用';

  @override
  String get scanChartOccupancyHint => '来自主动扫描，而非 RF 频谱';

  @override
  String get scanChartSelected => '所选网络';

  @override
  String get scanChartSignal => '信号历史';

  @override
  String get scanChartTable => '图表数据表';

  @override
  String get scanChartTimescale => '时间范围';

  @override
  String get scanChartUnitDbm => 'dBm';

  @override
  String get scanChartUnitPct => '百分比';

  @override
  String get scanColBand => '频段';

  @override
  String get scanColBssid => 'BSSID';

  @override
  String get scanColChannel => '信道';

  @override
  String get scanColChannelWidth => '信道宽度';

  @override
  String get scanColIssues => '问题';

  @override
  String get scanColPhyMode => '模式';

  @override
  String get scanColRssi => 'RSSI';

  @override
  String get scanColSecurity => '安全';

  @override
  String get scanColSsid => '网络名称';

  @override
  String get scanColVendor => '厂商';

  @override
  String get scanDetailsBand => '频段';

  @override
  String get scanDetailsBssid => 'BSSID';

  @override
  String get scanDetailsChannel => '信道';

  @override
  String get scanDetailsChannelWidth => '信道宽度';

  @override
  String get scanDetailsConnected => '已连接';

  @override
  String get scanDetailsCountry => '国家';

  @override
  String get scanDetailsEmpty => '选择一个网络';

  @override
  String get scanDetailsEncryption => '加密';

  @override
  String get scanDetailsFirstSeen => '首次发现';

  @override
  String get scanDetailsFrequencyMHz => '频率';

  @override
  String get scanDetailsLastSeen => '最近发现';

  @override
  String get scanDetailsMaxRateMbps => '最大速率';

  @override
  String get scanDetailsNetworkType => '类型';

  @override
  String get scanDetailsNoiseDbm => '噪声';

  @override
  String get scanDetailsPhyMode => '模式';

  @override
  String get scanDetailsSecurity => '安全';

  @override
  String get scanDetailsSignalPct => '信号';

  @override
  String get scanDetailsSignalQuality => '信号质量';

  @override
  String get scanDetailsSnrDb => 'SNR';

  @override
  String get scanDetailsSsid => 'SSID';

  @override
  String get scanDetailsVendor => '厂商';

  @override
  String get scanExportAll => '所有行';

  @override
  String get scanExportCsv => '导出 CSV';

  @override
  String get scanExportSelected => '所选行';

  @override
  String get scanExportVisible => '可见行';

  @override
  String get scanFieldUnavailable => '主动扫描无法提供';

  @override
  String get scanFileMenu => '文件';

  @override
  String get scanFileOpen => '打开快照…';

  @override
  String get scanFileSave => '保存快照…';

  @override
  String get scanPrintVisible => '打印可见表格…';

  @override
  String get scanFilterBand => '频段筛选';

  @override
  String get scanFilterBand24 => '2.4 GHz';

  @override
  String get scanFilterBand5 => '5 GHz';

  @override
  String get scanFilterBand6 => '6 GHz';

  @override
  String get scanFilterBandAll => '全部';

  @override
  String get scanFilterBand6Empty => '本次扫描没有 6 GHz 网络';

  @override
  String get scanFilterMinRssi => '最小 RSSI';

  @override
  String get scanFilterOpen => '开放';

  @override
  String get scanFilterSecure => '加密';

  @override
  String scanFilterSidebarChipCount(String label, int count) {
    return '$label ($count)';
  }

  @override
  String get scanFilterSidebarClear => '清除频段、安全和厂商筛选';

  @override
  String get scanFilterSidebarCollapse => '收起筛选面板';

  @override
  String get scanFilterSidebarEmpty => '暂无可筛选的网络。';

  @override
  String get scanFilterSidebarExpand => '展开筛选面板';

  @override
  String get scanFilterSidebarSectionBand => '频段';

  @override
  String get scanFilterSidebarSectionSecurity => '安全';

  @override
  String get scanFilterSidebarSectionVendor => '厂商';

  @override
  String get scanFilterSidebarTitle => '筛选';

  @override
  String get scanFilterSidebarVendorUnknown => '未知厂商';

  @override
  String get scanIssueCrowdedChannel => '信道拥挤';

  @override
  String get scanIssueDfs => 'DFS 信道';

  @override
  String get scanIssueHiddenSsid => '隐藏网络名称';

  @override
  String get scanIssueHighUtil => '信道利用率高';

  @override
  String get scanIssueLegacyOnly => '仅旧版 Wi‑Fi（a/b/g）';

  @override
  String get scanIssueLowSignal => '信号弱';

  @override
  String get scanIssueLowSnr => 'SNR 低';

  @override
  String get scanIssueOverlap24 => '非标准 2.4 GHz 信道';

  @override
  String get scanIssueWeakSecurity => '安全较弱';

  @override
  String get scanIssueWidth40on24 => '2.4 GHz 上使用 40 MHz 或更宽';

  @override
  String get scanQualityExcellent => '极佳';

  @override
  String get scanQualityFair => '一般';

  @override
  String get scanQualityGood => '良好';

  @override
  String get scanQualityPoor => '较差';

  @override
  String get scanQualityUnusable => '不可用';

  @override
  String get scanLocationDenied => '已拒绝';

  @override
  String get scanLocationGranted => '已授权';

  @override
  String get scanLocationNotDetermined => '未询问';

  @override
  String get scanLocationRestricted => '受限';

  @override
  String get scanScanCoreDemo => '演示';

  @override
  String get scanScanCoreError => '错误';

  @override
  String get scanScanCoreOk => '正常';

  @override
  String get scanSearchClear => '清除搜索';

  @override
  String get scanSearchPlaceholder => '筛选网络';

  @override
  String get scanSettingsOpen => '扫描设置';

  @override
  String get scanSettingsScanInterval => '扫描间隔';

  @override
  String scanSettingsScanIntervalSec(Object sec) {
    return '$sec 秒';
  }

  @override
  String get scanSettingsSignalUnit => '信号显示';

  @override
  String get scanSettingsSignalUnitDbm => 'dBm';

  @override
  String get scanSettingsSignalUnitPercent => '百分比';

  @override
  String get scanSettingsAutoStart => '启动时开始扫描';

  @override
  String get scanSettingsColumnsCellRules => '单元格高亮';

  @override
  String get scanSettingsColumnsCellRulesEnabled => '启用基于规则的高亮';

  @override
  String get scanSettingsColumnsCellRulesRssi => '信号质量（RSSI、SNR、噪声）';

  @override
  String get scanSettingsColumnsCellRulesSecurity => '开放和弱加密网络（WEP）';

  @override
  String get scanSettingsColumnsOpenVisibility => '管理列可见性…';

  @override
  String get scanSettingsTitle => '扫描设置';

  @override
  String get scanSettingsWindowTitle => 'LV24 WiFi Explorer 设置';

  @override
  String get scanSettingsTabGeneral => '常规';

  @override
  String get scanSettingsTabColumns => '列';

  @override
  String get scanSettingsTabAnnotations => '标注';

  @override
  String get scanSettingsTabVendor => '厂商数据库';

  @override
  String get scanSettingsTabAdvanced => '高级';

  @override
  String get scanSettingsIncludeHiddenSsid => '扫描时包含隐藏 SSID';

  @override
  String get scanSettingsDataSource => '数据源';

  @override
  String get scanSettingsLiveScan => '实时扫描';

  @override
  String get scanSettingsLanguage => '界面语言';

  @override
  String get scanSettingsClose => '关闭';

  @override
  String get scanSettingsAnnotationsAdd => '添加规则';

  @override
  String get scanSettingsAnnotationsPattern => 'BSSID 模式';

  @override
  String get scanSettingsAnnotationsText => '文本';

  @override
  String get scanSettingsAnnotationsEmpty => '尚无规则。添加 MAC 模式或导入 CSV。';

  @override
  String get scanSettingsAnnotationsImport => '导入 CSV';

  @override
  String get scanSettingsAnnotationsExport => '导出 CSV';

  @override
  String get scanSettingsAnnotationsRemove => '移除';

  @override
  String get scanSettingsVendorBundled => '内置——IEEE MA-L（24 位 OUI）的本地副本。';

  @override
  String scanSettingsVendorEntries(Object count) {
    return '条目：$count';
  }

  @override
  String scanSettingsVendorUpdated(Object date) {
    return '更新于：$date';
  }

  @override
  String get scanSettingsVendorRefreshHint =>
      '刷新：yarn oui:refresh（公开 IEEE 注册库，不使用第三方 API）。';

  @override
  String get scanSettingsAdvancedHideEmptySpectrum => '在频谱中隐藏空频段';

  @override
  String get scanSettingsAdvancedGraphLabels => '图表标签';

  @override
  String get scanSettingsAdvancedGraphLabelsSsid => '网络名称（SSID）';

  @override
  String get scanSettingsAdvancedGraphLabelsApName => '接入点名称';

  @override
  String get scanSettingsAdvancedGraphLabelsAnnotation => '标注';

  @override
  String get scanSettingsAdvancedFollowSystem => '跟随系统外观';

  @override
  String scanSnapshotOpenError(Object detail) {
    return '无法打开快照：$detail';
  }

  @override
  String get scanSsidHidden => '‹隐藏›';

  @override
  String get scanStatusAbout => '关于';

  @override
  String scanStatusFound(Object count) {
    return '网络：$count';
  }

  @override
  String scanStatusLastScan(Object time) {
    return '上次扫描：$time';
  }

  @override
  String scanStatusLocation(Object state) {
    return '定位：$state';
  }

  @override
  String scanStatusScanCore(Object state) {
    return 'ScanCore：$state';
  }

  @override
  String scanStatusSelected(Object count) {
    return '已选择：$count';
  }

  @override
  String get scanStatusShortcutsHint =>
      '⌘F 搜索 · ⌘P 暂停扫描 · ⌘1–4 详情 · 网格获焦时 ⌘C 复制 BSSID';

  @override
  String get scanStatusTimescaleHint => '信号 · 图表获焦时用 ↑ 或 ↓ 切换时间范围';

  @override
  String scanStatusVersion(Object version) {
    return 'v$version';
  }

  @override
  String get scanTypeIbss => 'Ad-hoc';

  @override
  String get scanTypeInfrastructure => '基础设施';

  @override
  String get scanTabAdvanced => '高级';

  @override
  String get scanTabCompare => '对比';

  @override
  String get scanTabDetails => '网络详情';

  @override
  String get scanTabOccupancy => '信道占用';

  @override
  String get scanTabSignal => '信号强度';

  @override
  String get scanTitleDemo => '演示';

  @override
  String get scanTitlePaused => '已暂停';

  @override
  String get scanTitleScanning => '扫描中';

  @override
  String get workbenchStart => '开始';

  @override
  String get workbenchStop => '停止';

  @override
  String get workbenchRedacted => '已隐藏';

  @override
  String get workbenchColumnsProfileDefault => '默认';

  @override
  String get workbenchColumnsProfiles => '配置文件';

  @override
  String get workbenchColumnsSaveProfile => '保存配置文件';

  @override
  String get workbenchColumnsDeleteProfile => '删除配置文件';

  @override
  String get workbenchColumnsProfileNameHint => '配置文件名称';

  @override
  String workbenchStatusDisplayed(int count) {
    return '已显示：$count';
  }

  @override
  String get workbenchOrganizeBy => '分组方式';

  @override
  String get workbenchOrganizeNone => '无';

  @override
  String get workbenchOrganizeVendor => '厂商';

  @override
  String get workbenchSaveFilterPreset => '保存预设';

  @override
  String get workbenchFilterPresetsTitle => '已保存的筛选';

  @override
  String get workbenchFilterPresetsEmpty => '没有已保存的筛选';

  @override
  String get workbenchFilterPresetsSave => '保存当前筛选';

  @override
  String get workbenchFilterPresetsNewName => '预设名称';

  @override
  String workbenchFilterPresetsDelete(String name) {
    return '删除“$name”';
  }
}
