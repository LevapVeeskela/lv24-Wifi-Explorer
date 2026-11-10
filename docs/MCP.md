# MCP server for agents

`@lv24/wifi-mcp` exposes the same scan data the desktop app shows — BSS table,
signal, channels, utilization and issue heuristics — to MCP clients (Claude
Desktop, Cursor, OpenCode, custom agents).

It is a thin stdio server on top of the same packages the app uses:

```
packages/mcp  →  @lv24/wifi-backend  →  ScanCore / nmcli / netsh / demo
      │                 │
      └────────────→  @lv24/wifi-core (domain, IE decode, issues, utilization)
```

No web/Electron code is imported, so the server runs in plain Node ≥ 20.

## Tools

| Tool             | Purpose                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| `wifi_providers` | Providers available on this platform + honest capability gaps           |
| `wifi_scan`      | Active scan → compact BSS rows (limit/field selection)                  |
| `wifi_network`   | One BSS by BSSID (from cache or a fresh scan)                           |
| `wifi_summary`   | Band/security/vendor counts, top channels, strongest/weakest            |
| `wifi_channels`  | Per-channel utilization + beacon-overhead **estimate**                  |
| `wifi_issues`    | Issue heuristics (low signal, overlap, open security, DFS, hidden SSID) |

Scan results are cached for 30 s; pass `refresh: true` to force a new scan.
Concurrent tool calls are serialized so only one native scan runs at a time.

## Build and run

```bash
npx -y @lv24/wifi-mcp                   # published package (1.0.1)
```

From the repository:

```bash
yarn build:packages        # core, backend, cli, mcp
# or
yarn build:mcp

node packages/mcp/dist/main.js          # stdio server
yarn mcp                                # same binary via root script
```

The server speaks JSON-RPC over stdin/stdout and logs only to stderr.

## Client configuration

Claude Desktop (`claude_desktop_config.json`):

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

Cursor (`.cursor/mcp.json`) and most clients use the same `mcpServers` shape.

OpenCode (`opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "lv24-wifi": {
      "type": "local",
      "command": ["node", "/absolute/path/to/lv24-Wifi-Explorer/packages/mcp/dist/main.js"],
      "enabled": true
    }
  }
}
```

## macOS live data

Full SSID/BSSID/channel-width/IE data comes from the signed `ScanCore.app`.
The server resolves the helper in this order:

1. `LV24_SCANCORE_PATH` — path to `ScanCore.app/Contents/MacOS/ScanCore`
2. `LV24_RESOURCES_PATH` — e.g. the packaged app's `Contents/Resources`
3. `native/ScanCore/.build/ScanCore.app/...` relative to the working directory

If the helper is missing or Location is denied, the server reports a scan
error; it does not silently invent network names. Use the demo provider
explicitly for fixtures:

```json
{ "provider": "demo" }
```

## Data honesty

- `wifi_channels.beaconAirtimePct` is an **estimate** (`estimate: true`), never a
  measurement; it uses beacon bytes at the advertised basic rate.
- Linux (`nmcli`) and Windows (`netsh`) provide no channel width, noise or IEs;
  `wifi_providers` lists these gaps instead of faking values.
- Vendor names come from the IEEE MA-L registry when
  `data/oui/ieee-mal.csv` is available (`LV24_OUI_REGISTRY` overrides); randomized
  MACs report `vendor: null`.
- Issue ids and thresholds are the same as in the app; `wifi_issues` returns ids
  plus stable `scan.issue.*` message keys, not localized prose.

## Security

- Read-only: no scan parameters are persisted, no files are written.
- Local stdio only; no network listener, no telemetry, no cloud upload.
- Scan data (SSID/BSSID) stays in process memory and is never logged by default.
