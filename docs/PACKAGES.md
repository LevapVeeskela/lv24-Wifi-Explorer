# Package layout and publishing

The repository is a Yarn 1 workspace. Libraries are independently publishable;
apps are hosts that consume them.

```
packages/
  core/       @lv24/wifi-core       pure domain + scan mapping (no DOM/Node/Electron)
  backend/    @lv24/wifi-backend    provider API + macOS/Linux/Windows/demo providers
  cli/        @lv24/wifi-cli        `lv24-wifi` binary (Node 20+, all OS)
  mcp/        @lv24/wifi-mcp        MCP stdio server for AI agents (Node 20+)
  web/        @lv24/wifi-web        React + MUI renderer (Vite)
  desktop/    @lv24/wifi-desktop    Electron main/preload + provider lifecycle
native/ScanCore                     universal Swift helper (macOS 13.5+)
flutter/ + packages/scan_*          Flutter client + Dart packages
```

Dependency direction: `core ← backend ← cli`; `core ← web`;
`backend + core ← desktop`; `backend + core ← mcp`. No reverse imports.

## Cross-platform scan sources

| OS          | Provider         | Data quality                                             |
| ----------- | ---------------- | -------------------------------------------------------- |
| macOS 13.5+ | `macos-scancore` | CoreWLAN + Location; IEs, channel width, PHY             |
| Linux       | `linux-nmcli`    | NetworkManager; RSSI derived from signal quality, no IEs |
| Windows     | `windows-netsh`  | `netsh` English output; no IEs, channel width unknown    |
| any         | `demo`           | deterministic fixtures                                   |

Unsupported/denied paths emit typed errors; the desktop falls back to demo with
an explicit badge, the CLI prints the error and exits non-zero.

## Build & publish

```bash
yarn build:packages            # core → backend → cli → mcp
```

Publishing is done by
[`.github/workflows/npm-publish.yml`](../.github/workflows/npm-publish.yml) with
npm Trusted Publishing (OIDC): no `NPM_TOKEN`, no one-time password. It runs on
manual `workflow_dispatch` (`version` input) and validates that all four
`package.json` versions and the internal dependency pins
equal the requested version, builds, checks `lv24-wifi --version`, then publishes
in dependency order — `@lv24/wifi-core`, `@lv24/wifi-backend`, `@lv24/wifi-cli`,
`@lv24/wifi-mcp` — with `--access public --provenance`. A package version that
already exists on npm is skipped individually.

One-time setup (owner, on npmjs.com → package → **Settings → Trusted
publishing**) for **each** of the four packages:

| Field                | Value                |
| -------------------- | -------------------- |
| Publisher            | GitHub Actions       |
| Organization or user | `LevapVeeskela`      |
| Repository           | `lv24-Wifi-Explorer` |
| Workflow filename    | `npm-publish.yml`    |
| Environment          | _(empty)_            |

Release order:

1. Dispatch `npm-publish.yml` and wait until all four packages are live:
   `npm view @lv24/wifi-cli@1.0.1 version`.
2. Dispatch `pypi-publish.yml` with the same version. The Python launcher pins
   the matching npm versions, so publishing it first would point users at
   packages that do not exist yet. Both workflows are manual, so the operator
   controls the order.

Published at **1.0.1** on npm: `@lv24/wifi-core`, `@lv24/wifi-backend`, `@lv24/wifi-cli`, `@lv24/wifi-mcp`.
The desktop app and the Windows installer are at `1.1.0`; the packages, the app
and the Flutter client share the source tree but ship as separate artifacts
with independent versions.
Each package has `files: ["dist"]`, `license: MIT`, `engines.node >= 20`, and
CJS output for maximum consumer compatibility (`packages/mcp` is ESM because the MCP SDK is ESM-only). The web/desktop apps are MIT
code but the desktop UI depends on commercial MUI X Pro (see `CONTRIBUTING.md`).

## Desktop packaging

```bash
yarn dist:mac     # builds universal ScanCore, then DMG (x64 + arm64)
yarn dist:win     # NSIS (uses netsh provider; no native helper)
```

Electron main/preload are bundled with esbuild (`scripts/build-desktop.mjs`), so
workspace packages do not need to be present in `node_modules` inside the asar.

### macOS signing

`ScanCore.app` is launched through LaunchServices and communicates over a
private Unix socket. TCC only grants Location to a **stably signed** helper;
`yarn build:scancore` auto-selects the first Apple Development / Developer ID
identity (override `CODESIGN_IDENTITY=...`). Without it, macOS redacts
SSID/BSSID and the UI shows RF-only rows (not “hidden” networks).

### Redistributable builds

The UI depends on commercial MUI X Pro. A build that contains
`VITE_MUI_LICENSE_KEY` is **not redistributable**. Use `dist:mac:public` for
macOS or `release-desktop.yml` for Windows/Linux; both force a keyless build and
run `check:public-bundle`. The rule and the Store consequences are in
[`RELEASE.md`](RELEASE.md#1a-private-vs-public-macos-artifacts) and
[`DISTRIBUTION-MICROSOFT-STORE.md`](DISTRIBUTION-MICROSOFT-STORE.md).

## GitHub-native distribution

Two additional channels live in this repository. Both are published by
**manual `workflow_dispatch` workflows only** — there are no push, PR, tag or
schedule triggers, and they run on free hosted `ubuntu-latest` minutes of this
public repository. Zero spend: no paid runners, larger runners, cache uploads or
third-party paid actions.

### Container image (GHCR) — recommended for servers and agents

`ghcr.io/levapveeskela/lv24-wifi-explorer` contains the headless `lv24-wifi`
CLI and the `lv24-wifi-mcp` stdio server (no Electron/Flutter UI), built from
`docker/Dockerfile` (`linux/amd64`, runs as the unprivileged `node` user).

```bash
docker pull ghcr.io/levapveeskela/lv24-wifi-explorer:1.0.0

docker run --rm ghcr.io/levapveeskela/lv24-wifi-explorer providers
docker run --rm ghcr.io/levapveeskela/lv24-wifi-explorer scan --provider demo
docker run --rm ghcr.io/levapveeskela/lv24-wifi-explorer scan --provider demo --format json

# MCP server over stdio: keep stdin open, everything else is the MCP client's job
docker run -i --rm ghcr.io/levapveeskela/lv24-wifi-explorer mcp
```

- Tags: `<version>` on every manual run, `latest` only when the `push_latest`
  input is set.
- `demo` is deterministic and works everywhere, including the container.
- **Live Linux scans are not available in the image**: the `linux-nmcli`
  provider needs NetworkManager (`nmcli`) and D-Bus, which this image does not
  ship. Inside the container `--provider auto` therefore selects `linux-nmcli`
  and fails with `NMCLI_FAILED: spawn nmcli ENOENT`, so pass `--provider demo`
  explicitly. Run live scans on the host, or extend `docker/Dockerfile`.
- Vendor names in MCP output are optional. Mount the OUI registry and point the
  server at it:
  `-v "$PWD/data/oui:/oui:ro" -e LV24_OUI_REGISTRY=/oui/ieee-mal.csv`.
- Workflow: `.github/workflows/ghcr-publish.yml` (inputs: `version`,
  `push_latest`). Build locally with:
  `docker build -f docker/Dockerfile -t ghcr.io/levapveeskela/lv24-wifi-explorer:dev .`
- GitHub may create a package with **private** visibility on first publish.
  `lv24-wifi-explorer:1.0.0` is public — an anonymous `docker pull` was verified
  on 2026-11-10. If a future package is created private, open its settings and
  change visibility to public. The image carries the
  `org.opencontainers.image.source` label, which links the package to this
  repository.

### npm bundle (GitHub Packages) — convenience alias

GitHub Packages' npm registry cannot host the canonical packages for this
repository. From the current GitHub documentation
(<https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry>):

> GitHub Packages only supports scoped npm packages. Scoped packages have names
> with the format of `@NAMESPACE/PACKAGE-NAME`.

> Replace `NAMESPACE` with the name of the user or organization account to which
> the package will be scoped.

> You need an access token to publish, install, and delete private, internal, and
> public packages.

`@lv24` does not resolve to the repository owner: `github.com/lv24` is a
separate GitHub user account (created 2023-05-08), not `LevapVeeskela` and not
an organisation of this repository. GitHub Packages routes `@NAMESPACE/...` to
the account or organisation named by the scope, so `@lv24/*` can only be
published by a token with publish rights in the `lv24` namespace. The
repository's `GITHUB_TOKEN` (`packages: write` for this repository) cannot
publish there.

Scopes and package names must be lowercase, so the bundle uses the lowercase
form of the owner login (`LevapVeeskela` → `@levapveeskela`).

Instead, `packages/gh-bundle` publishes the no-code meta-package
`@levapveeskela/lv24-wifi-explorer@1.0.1`, which depends on the published npmjs
packages `@lv24/wifi-cli@1.0.1` and `@lv24/wifi-mcp@1.0.1` and therefore
provides the same `lv24-wifi` / `lv24-wifi-mcp` binaries. It is not a second
implementation and not a replacement for the canonical npmjs installs:

```bash
# ~/.npmrc — GitHub Packages requires a token even for public packages
# @levapveeskela:registry=https://npm.pkg.github.com
# //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}

npm install -g @levapveeskela/lv24-wifi-explorer
```

The token is a personal access token (classic) with `read:packages`; publishing
uses the workflow's `GITHUB_TOKEN` with `packages: write`. `@lv24/*`
dependencies still resolve from the public npm registry. Workflow:
`.github/workflows/gh-packages-publish.yml` (manual only, publishes just
`packages/gh-bundle`, optional `dry_run`). The package page is public, but
GitHub Packages still requires a token to install any npm package, public or
private — that is a registry rule, not a visibility setting.
