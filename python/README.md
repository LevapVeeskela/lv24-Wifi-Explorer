# lv24-wifi-explorer (Python launcher)

A thin Python launcher for **LV24 WiFi Explorer**: the `lv24-wifi` command-line
scanner and the `lv24-wifi-mcp` MCP server. Both commands are implemented by
Node.js packages published on npm as
[`@lv24/wifi-cli`](https://www.npmjs.com/package/@lv24/wifi-cli) and
[`@lv24/wifi-mcp`](https://www.npmjs.com/package/@lv24/wifi-mcp). This package
neither reimplements them nor bundles Node.js: each console script delegates
through `npx --yes <package>@<version>`, inherits stdio and the environment, and
returns the child process exit code.

The npm packages remain the canonical distribution. The PyPI package only
contains this launcher.

## Prerequisites

- **Python 3.9 or newer.**
- **Node.js 20 or newer**, including npm and npx
  ([nodejs.org](https://nodejs.org/)). The npm packages declare
  `engines.node >= 20`.
- A native scan source for live data; `--provider demo` works everywhere:
  - **macOS 13.5+**: CoreWLAN through the signed `ScanCore` helper with
    Location Services permission. Point `LV24_SCANCORE_PATH` at the binary if
    it is not resolvable automatically.
  - **Linux**: NetworkManager (`nmcli`). Channel width and IEs are unknown by
    design.
  - **Windows**: `netsh wlan show networks mode=bssid` (English output).
    Channel width and IEs are unknown by design.
- Network access on first run (or a warm npm cache), because `npx` may download
  the requested npm package.

## Installation

```bash
pip install lv24-wifi-explorer
```

This installs two console scripts:

- `lv24-wifi` — the CLI
- `lv24-wifi-mcp` — the stdio MCP server

## CLI

```bash
lv24-wifi providers
lv24-wifi scan --provider auto --format table
lv24-wifi scan --ssid "Cafe" --format json
lv24-wifi scan --provider demo --format json --out scan.json
```

All arguments are forwarded unchanged to `@lv24/wifi-cli`. The child process
inherits the terminal, environment and exit code. The module form is
equivalent:

```bash
python -m lv24_wifi_explorer --help
```

## MCP server

`lv24-wifi-mcp` speaks the Model Context Protocol over stdio. Use it as the
command in any MCP client; stdout carries the protocol and diagnostics go to
stderr.

OpenCode (`opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "lv24-wifi": {
      "type": "local",
      "command": ["lv24-wifi-mcp"],
      "enabled": true
    }
  }
}
```

Claude Desktop, Cursor and other clients use the usual `mcpServers` shape:

```json
{
  "mcpServers": {
    "lv24-wifi": {
      "command": "lv24-wifi-mcp",
      "args": []
    }
  }
}
```

If the console script is not on the client's `PATH`, use
`"command": "python", "args": ["-m", "lv24_wifi_explorer.mcp"]` or an absolute
path to the installed script. Tool reference and macOS helper setup:
[`docs/MCP.md`](https://github.com/LevapVeeskela/lv24-Wifi-Explorer/blob/master/docs/MCP.md).

## Version pinning

By default each script runs the npm version matching the installed Python
package (currently `1.0.0`). Override the npm version or dist-tag per command:

| Command         | Environment variable   | Default npm package |
| --------------- | ---------------------- | ------------------- |
| `lv24-wifi`     | `WIFI_CLI_NPM_VERSION` | `@lv24/wifi-cli`    |
| `lv24-wifi-mcp` | `WIFI_MCP_NPM_VERSION` | `@lv24/wifi-mcp`    |

Bash / zsh:

```bash
WIFI_CLI_NPM_VERSION=latest lv24-wifi --help
WIFI_MCP_NPM_VERSION=1.0.0 lv24-wifi-mcp
```

PowerShell:

```powershell
$env:WIFI_CLI_NPM_VERSION = "latest"; lv24-wifi --help
$env:WIFI_MCP_NPM_VERSION = "1.0.0"; lv24-wifi-mcp
```

## Exit codes

- The child process exit code is returned unchanged.
- `127` — `npx` was not found on `PATH`, or it could not be started. An
  installation hint is printed to stderr.
- `130` — the launcher was interrupted (`Ctrl+C`).

## Links

- Repository: <https://github.com/LevapVeeskela/lv24-Wifi-Explorer>
- PyPI and publishing notes:
  <https://github.com/LevapVeeskela/lv24-Wifi-Explorer/blob/master/docs/pypi.md>
- Issues: <https://github.com/LevapVeeskela/lv24-Wifi-Explorer/issues>
- npm CLI: <https://www.npmjs.com/package/@lv24/wifi-cli>
- npm MCP server: <https://www.npmjs.com/package/@lv24/wifi-mcp>

## License

MIT
