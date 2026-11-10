# @levapveeskela/lv24-wifi-explorer

Meta-package that publishes the **LV24 WiFi Explorer** CLI and MCP server to
GitHub Packages. It contains no code: it installs the real packages that are
already published on npm:

| Package          | Binary          | What it is                                |
| ---------------- | --------------- | ----------------------------------------- |
| `@lv24/wifi-cli` | `lv24-wifi`     | cross-platform Wi-Fi scan CLI (Node 20+)  |
| `@lv24/wifi-mcp` | `lv24-wifi-mcp` | MCP stdio server for AI agents (Node 20+) |

Canonical installs do **not** need this bundle or any authentication:

```bash
npm install -g @lv24/wifi-cli @lv24/wifi-mcp
```

## Why this package exists

GitHub Packages only accepts scoped npm packages and routes the scope to the
GitHub account or organisation that owns it. The upstream packages are scoped
`@lv24`, which resolves to a different GitHub account than the repository
owner, so they cannot be republished here by this repository's workflow. This
bundle uses the repository owner's scope instead, which gives the repository a
GitHub-native npm entry without duplicating any code.

The container image is the better choice for servers and sandboxes:
`ghcr.io/levapveeskela/lv24-wifi-explorer` (see `docs/PACKAGES.md`).

## Install

GitHub Packages requires an access token even for public packages. Create a
personal access token (classic) with `read:packages`, then:

```bash
# ~/.npmrc
# @levapveeskela:registry=https://npm.pkg.github.com
# //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}

npm install -g @levapveeskela/lv24-wifi-explorer
lv24-wifi providers
lv24-wifi scan --provider demo
```

The `@lv24/*` dependencies still resolve from the public npm registry, so
`.npmrc` only needs the `@levapveeskela` scope mapping.

MIT licensed. Issues: <https://github.com/LevapVeeskela/lv24-Wifi-Explorer/issues>.
