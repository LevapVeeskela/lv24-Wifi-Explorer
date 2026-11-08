# @lv24/wifi-mcp

MCP (Model Context Protocol) server that exposes live LV24 Wi-Fi Explorer scan data to AI
agents over stdio. Local, read-only, no network calls of its own.

## Tools

| Tool             | Arguments                                                                                                    | Returns                                                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `wifi_providers` | —                                                                                                            | Available scan providers for this platform + capability map (`ssid`, `bssid`, `channelWidth`, `noise`, `informationElements`), macOS ScanCore helper/env state                                                     |
| `wifi_scan`      | `provider?`, `ssid?`, `includeHidden?`, `intervalMs?`, `timeoutMs?`, `limit?` (1–500, default 50), `fields?` | `{ provider, source, demo, capturedAt, location, total, returned, networks[] }`, strongest first                                                                                                                   |
| `wifi_network`   | `bssid` (any case/separators), `refresh?`                                                                    | Compact row, or `{ "error": "not_found" }`                                                                                                                                                                         |
| `wifi_summary`   | `refresh?`, `top?` (1–20, default 5)                                                                         | Band/security/vendor counts, busiest channels, strongest/weakest, hidden/open counts                                                                                                                               |
| `wifi_channels`  | `refresh?`, `band?` (`2.4` / `5` / `6`), `includeEmpty?`                                                     | `{ capturedAt, source, demo, estimate: true, note, channels[], byBand[], overall }`; per channel `{ band, channel, networks, overlappingBss, strongestRssiDbm, averageRssiDbm, beaconAirtimePct, estimate: true }` |
| `wifi_issues`    | `refresh?`, `bssid?`                                                                                         | `{ counts, rowsWithIssues, rows[] }`; per row `{ bssid, ssid, issues: [{ id, severity, messageKey }] }`. Unknown `bssid` → `{ "error": "not_found" }`                                                              |

### Channel utilization is an estimate

`beaconAirtimePct` (and `overall`/`byBand` totals) are **modelled**, not measured: beacon
frame size is assumed (250 B) and transmitted at the BSS `maxRate` (falling back to the
6 Mbps basic-rate floor). Treat the value as a relative indicator of beacon overhead and
never as measured airtime — every row and the payload carry `estimate: true`, and `note`
repeats the caveat. `band` filters the scan rows before aggregation, so `byBand`/`overall`
describe the selected band only. `includeEmpty` adds zero-count rows for the standard
channel plan (14 rows on 2.4 GHz, 28 on 5 GHz, 59 on 6 GHz) — useful for occupancy grids,
noisy for LLM context.

### Issue ids and severities

`bssid` narrows `rows` only; `counts` and `rowsWithIssues` always describe the whole scan,
because the heuristics are scan-relative (neighbor overlap, SSID groups, total BSS count).
`messageKey` is stable i18n (`scan.issue.<id>`), so clients can localize without matching text.

| Severity  | Issue ids                                                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `warning` | `width40on24`, `overlap24`, `crowdedChannel`, `lowSignal`, `lowSnr`, `weakSecurity`, `hiddenSsid`, `legacyOnly`, `highUtil`, `tooManyNetworks` |
| `info`    | `dfs`, `band24only`, `largeGroup`                                                                                                              |

Compact network fields: `bssid`, `ssid`, `hidden`, `rssiDbm`, `snrDb`, `noiseDbm`, `channel`,
`band`, `widthMhz`, `security`, `phy`, `vendor`, `lastSeenAt`. Unknown `fields` names are
ignored with a stderr warning.

All tool results are JSON text. Failures return `isError: true` with a readable message — never
a stack trace. Scans are serialized and the last snapshot is cached for 30 s, so consecutive
tool calls do not spawn a new native scan.

## Providers

| `provider`       | Platform | Notes                                                              |
| ---------------- | -------- | ------------------------------------------------------------------ |
| `auto` (default) | any      | Native provider for the platform, falls back to `demo`             |
| `demo`           | any      | Deterministic fixtures — 3 networks, no radio access               |
| `macos-scancore` | macOS    | Swift helper; needs Bluetooth/Wi-Fi + Location Services permission |
| `linux-nmcli`    | Linux    | `nmcli dev wifi list`; no channel width/IE/noise                   |
| `windows-netsh`  | Windows  | `netsh wlan show networks mode=bssid`; English output only         |

### macOS helper

ScanCore must be built (`yarn build:scancore`) or located by env var:

```bash
export LV24_SCANCORE_PATH=/path/to/ScanCore.app/Contents/MacOS/ScanCore
# or point at the app/resources folder:
export LV24_RESOURCES_PATH=/path/to/dir-containing/ScanCore.app
```

`wifi_providers` reports `macosHelper.resolvable` and which env vars are set.

### Vendor lookup

Vendor names come from the local public IEEE MA-L registry, read in this order:

1. `LV24_OUI_REGISTRY` (path to `ieee-mal.csv`)
2. `<cwd>/data/oui/ieee-mal.csv`
3. `<repo>/data/oui/ieee-mal.csv`

If the file is missing, `vendor` is `null` and scans keep working. Locally administered
(randomized) MACs never get a vendor.

## Run

After building:

```bash
yarn workspace @lv24/wifi-mcp build
node packages/mcp/dist/main.js
# or from the repo root:
yarn mcp
```

Published package: `npx @lv24/wifi-mcp` (`bin: lv24-wifi-mcp`). Stdout carries the MCP
protocol; diagnostics go to stderr only.

### Demo mode

Pass `"provider": "demo"` in the `wifi_scan` call (recommended for evaluating the server on a
machine without a scanner). There is no env switch — the provider is a per-call argument.

## Client configuration

Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "lv24-wifi": {
      "command": "node",
      "args": ["/absolute/path/to/lv24-Wifi-Explorer/packages/mcp/dist/main.js"],
      "env": { "LV24_SCANCORE_PATH": "/absolute/path/to/ScanCore.app/Contents/MacOS/ScanCore" }
    }
  }
}
```

Cursor (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "lv24-wifi": {
      "command": "node",
      "args": ["/absolute/path/to/lv24-Wifi-Explorer/packages/mcp/dist/main.js"]
    }
  }
}
```

OpenCode (`opencode.json` / `~/.config/opencode/opencode.json`):

```json
{
  "mcp": {
    "lv24-wifi": {
      "type": "local",
      "command": ["node", "/absolute/path/to/lv24-Wifi-Explorer/packages/mcp/dist/main.js"],
      "enabled": true
    }
  }
}
```

After publishing, `"command": "npx", "args": ["-y", "@lv24/wifi-mcp"]` works instead of the
absolute path.

## Security

- Read-only: the server only starts scanner providers and reads the local IEEE CSV.
- No network egress, no credentials, no telemetry.
- BSSID/SSID data stays local to the MCP client; `vendor` is derived locally.
- Location-gated macOS fields (BSSID, SSID, country) are reported as `null` when Location
  Services are denied — the server does not attempt to bypass them.

## Development

```bash
yarn workspace @lv24/wifi-mcp build
yarn workspace @lv24/wifi-mcp typecheck
npx vitest run packages/mcp
```
