/**
 * Public API of `@lv24/wifi-mcp` (server factory + reusable scan/format helpers).
 */

export { createWifiMcpServer, WIFI_MCP_SERVER_NAME, WIFI_MCP_SERVER_VERSION } from './server.js';
export {
  ScanService,
  ScanServiceError,
  DEFAULT_CACHE_TTL_MS,
  DEFAULT_INTERVAL_MS,
  DEFAULT_TIMEOUT_MS,
  type GetSnapshotOptions,
  type ScanRequestOptions,
  type ScanServiceDeps,
  type ScanSnapshot,
} from './scan/service.js';
export {
  loadOuiLookup,
  parseOuiCsv,
  resetOuiLookupCache,
  resolveOuiRegistryPath,
  splitCsvLine,
} from './scan/oui.js';
export { macScanCoreCandidates, resolveMacScanCoreBinary } from './scan/helper.js';
export {
  COMPACT_FIELDS,
  DEFAULT_COMPACT_FIELDS,
  isCompactField,
  selectFields,
  toCompactNetwork,
  unknownFields,
  type CompactField,
  type CompactNetwork,
  type PartialCompactNetwork,
} from './format/compact.js';
export { buildSummary, type WifiSummary } from './format/summary.js';
export {
  runWifiScan,
  createWifiScanHandler,
  registerWifiScanTool,
  SCAN_PROVIDERS,
  DEFAULT_SCAN_LIMIT,
  MAX_SCAN_LIMIT,
  type WifiScanArgs,
  type WifiScanPayload,
} from './tools/scan.js';
export {
  runWifiNetwork,
  createWifiNetworkHandler,
  registerWifiNetworkTool,
  normalizeBssid,
  type WifiNetworkArgs,
  type WifiNetworkPayload,
} from './tools/network.js';
export {
  runWifiSummary,
  createWifiSummaryHandler,
  registerWifiSummaryTool,
  DEFAULT_SUMMARY_TOP,
  MAX_SUMMARY_TOP,
  type WifiSummaryArgs,
  type WifiSummaryPayload,
} from './tools/summary.js';
export {
  providersPayload,
  registerWifiProvidersTool,
  type ProviderCapabilities,
  type ProviderInfo,
  type ProvidersPayload,
} from './tools/providers.js';
export {
  runWifiChannels,
  createWifiChannelsHandler,
  registerWifiChannelsTool,
  BEACON_ESTIMATE_NOTE,
  CHANNEL_BAND_ARGS,
  type ChannelBandArg,
  type CompactChannel,
  type WifiChannelsArgs,
  type WifiChannelsPayload,
} from './tools/channels.js';
export {
  runWifiIssues,
  createWifiIssuesHandler,
  registerWifiIssuesTool,
  toScanIssueRows,
  type IssueReportRow,
  type ReportIssue,
  type WifiIssuesArgs,
  type WifiIssuesNotFound,
  type WifiIssuesPayload,
} from './tools/issues.js';
export {
  errorMessage,
  errorResult,
  jsonResult,
  withErrorHandling,
  type ToolTextResult,
} from './tools/shared.js';
