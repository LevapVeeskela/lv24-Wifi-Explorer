# PyPI launcher (`lv24-wifi-explorer`)

`lv24-wifi-explorer` is a thin Python package that exposes the LV24 WiFi
Explorer CLI and MCP server as `lv24-wifi` and `lv24-wifi-mcp`. It contains no
scanner logic. Each script locates `npx` on `PATH` and runs:

```text
npx --yes @lv24/wifi-cli@<version> <args>
npx --yes @lv24/wifi-mcp@<version> <args>
```

The npm packages [`@lv24/wifi-cli`](https://www.npmjs.com/package/@lv24/wifi-cli)
and [`@lv24/wifi-mcp`](https://www.npmjs.com/package/@lv24/wifi-mcp) remain the
canonical distribution. The PyPI package is only a launcher; it does not bundle
Node.js, the Swift ScanCore helper or any native scanner.

> **Status:** **1.0.1** is the current launcher and npm package version;
> `1.0.0` was the first live release on PyPI (2026-11-10). Publishing uses
> Trusted Publishing (OIDC) and needs no API token. Release order is npm first,
> then PyPI (see [Release process](#release-process)).

## Install and run

```bash
pip install lv24-wifi-explorer

lv24-wifi providers
lv24-wifi scan --provider demo --format json
lv24-wifi-mcp            # stdio MCP server
```

Module forms:

```bash
python -m lv24_wifi_explorer --help
python -m lv24_wifi_explorer.mcp
```

## Supported systems and prerequisites

The launcher itself runs anywhere Python 3.9+ and Node.js 20+ are available.
Live scanning depends on the platform provider:

| Platform    | Provider         | Requirements and data quality                                                              |
| ----------- | ---------------- | ------------------------------------------------------------------------------------------ |
| macOS 13.5+ | `macos-scancore` | Signed ScanCore helper with Location Services; full SSID/BSSID, width, PHY, IEs            |
| Linux       | `linux-nmcli`    | NetworkManager (`nmcli`); RSSI from signal quality, channel width/IEs unknown              |
| Windows     | `windows-netsh`  | `netsh` BSS scan with localized output; channel width/IEs unknown                          |
| Any         | `demo`           | Deterministic fixtures, no radio access; use `--provider demo` or MCP `"provider": "demo"` |

The first run may download the npm package through `npx`; later runs reuse the
npm cache. Set `LV24_SCANCORE_PATH` when the macOS helper is not resolvable
automatically. See [`MCP.md`](MCP.md) and [`SPEC.md`](SPEC.md) for field-level
details.

## Version pinning

The launcher version, both npm package versions and the Python package version
must stay equal. Override the npm side without upgrading the launcher:

| Command         | Variable               | Example                                    |
| --------------- | ---------------------- | ------------------------------------------ |
| `lv24-wifi`     | `WIFI_CLI_NPM_VERSION` | `WIFI_CLI_NPM_VERSION=latest lv24-wifi`    |
| `lv24-wifi-mcp` | `WIFI_MCP_NPM_VERSION` | `WIFI_MCP_NPM_VERSION=1.0.1 lv24-wifi-mcp` |

PowerShell:

```powershell
$env:WIFI_CLI_NPM_VERSION = "latest"; lv24-wifi --help
$env:WIFI_MCP_NPM_VERSION = "1.0.1"; lv24-wifi-mcp
```

## Exit codes

The child exit code is propagated unchanged. The launcher returns `127` when
`npx` is missing or cannot be started (with an installation hint on stderr) and
`130` when interrupted with `Ctrl+C`.

On Windows the launcher starts npm's `npx-cli.js` with Node.js directly instead
of the `npx.cmd` shim. `cmd.exe` would re-parse the command line, so an SSID such
as `Cafe&Bar`, a `%PATH%`-like value or `a^b` would be altered before it reaches
the CLI; the direct Node invocation keeps every argument intact.

## Release process

Publishing uses PyPI Trusted Publishing (OIDC). No API token, password or PyPI
secret is stored in the repository or in GitHub.

One-time setup on PyPI, done by the maintainer before the first release:

1. Create the `lv24-wifi-explorer` project (or a **pending trusted publisher**
   if the project does not exist yet).
2. Trusted publisher values:
   - Owner: `LevapVeeskela`
   - Repository: `lv24-Wifi-Explorer`
   - Workflow: `pypi-publish.yml`
   - Environment: leave empty
3. Do not create an API token for CI.

The four npm packages have separate trusted-publisher entries on npmjs.com
(`npm-publish.yml`); see
[`PACKAGES.md`](PACKAGES.md#build--publish) for that one-time setup.

The workflow [`.github/workflows/pypi-publish.yml`](../.github/workflows/pypi-publish.yml)
runs on a published GitHub release or manual dispatch. It:

1. validates the requested version (release tag without `v`, or manual input)
   against `packages/cli/package.json`, `packages/mcp/package.json`,
   `python/pyproject.toml` and `python/src/lv24_wifi_explorer/__init__.py`;
2. runs the launcher unit tests;
3. builds the sdist and wheel with `python -m build`;
4. checks metadata with `twine check`;
5. skips the upload if that version already exists on PyPI;
6. publishes with `pypa/gh-action-pypi-publish` using the GitHub OIDC token.

The release order is fixed: npm packages first, Python launcher second. The
launcher defaults to `@lv24/wifi-cli@1.0.1` / `@lv24/wifi-mcp@1.0.1`, so a
launcher published before those npm versions exists would fail on first run.

To release a new version:

```bash
# 1. Bump the same version in every package manifest and version guard:
#    packages/core, packages/backend, packages/cli, packages/mcp
#    (versions + internal dependency pins), python/pyproject.toml and
#    python/src/lv24_wifi_explorer/__init__.py.
# 2. Dispatch npm-publish.yml (Trusted Publishing/OIDC) and wait until all
#    four npm packages are live.
# 3. Dispatch pypi-publish.yml with version = X.Y.Z (or publish the GitHub
#    release only after npm is live, since a release triggers both workflows).
```

The workflow only runs on an explicit release or manual dispatch, uses
`ubuntu-latest`, and uses no paid runners or services (public repository).

## Local validation

```bash
cd python
python -m compileall -q src tests
python -m unittest discover -s tests -v
python -m build
python -m twine check dist/*
```

Expected distribution names: `lv24_wifi_explorer-<version>-py3-none-any.whl`
and `lv24_wifi_explorer-<version>.tar.gz`. The wheel contains only the launcher
modules and the MIT license file, uses the README as its PyPI description, and
has no runtime dependencies.
