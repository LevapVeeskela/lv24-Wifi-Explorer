# Distribution channels

Where the desktop app can be published, what each channel costs, and what is
actually ready today. Companion documents:

- [`RELEASE.md`](RELEASE.md) — how to build and verify the artifacts.
- [`PACKAGES.md`](PACKAGES.md) — npm/CLI package publishing.
- [`DISTRIBUTION-MICROSOFT-STORE.md`](DISTRIBUTION-MICROSOFT-STORE.md) — MSI/EXE
  vs MSIX, Partner Center, signing, licences.

Everything below is free: no paid account, certificate or runner is needed for the
channels this repository can actually use. The one exception is `homebrew/cask`,
which requires a paid Apple Developer membership for notarization and therefore
stays blocked under the zero-spend policy.

## Current state (2026-11-10)

| Artifact                                                | Exists? | Notes                                                                       |
| ------------------------------------------------------- | ------- | --------------------------------------------------------------------------- |
| `LV24-WiFi-Explorer-1.0.3-win-x64.exe`                  | yes     | v1.0.3 Release, built 2026-11-10; SHA-256 `8c0d9c85…f8d4`                   |
| `LV24-WiFi-Explorer-1.0.3-linux-x86_64.AppImage`        | yes     | v1.0.3 Release, built 2026-11-10; SHA-256 `34720f12…8958`                   |
| `LV24-WiFi-Explorer-1.0.0-arm64-public.dmg`             | yes     | In the v1.0.0 GitHub Release; unsigned, unnotarized, arm64 only             |
| `LV24-WiFi-Explorer-1.0.0-x64-public.dmg`               | no      | `dist:mac:public` builds it; it was never uploaded                          |
| `LV24-WiFi-Explorer-1.0.1/1.0.2-*`                      | yes     | Superseded; use v1.0.3 (issue counter visible by default)                   |
| `checksums.txt` (release) / `SHA256SUMS.txt` (workflow) | yes     | `checksums.txt` covers the arm64 DMG; `SHA256SUMS.txt` covers Windows+Linux |

Consequences: **Scoop is live at 1.0.3**, winget is submitted for 1.0.0 but its
Installation Validation currently fails with `shellExecute` (CLA is signed),
Chocolatey and AppImageHub can follow with the same v1.0.3 asset and hash.
**Microsoft Store is on hold**: the listing draft is ready, but no free trusted
Authenticode certificate exists (SignPath Foundation declined; Certum is paid).
**Homebrew `homebrew/cask` is not eligible** while the DMG is unnotarized; the
self-hosted tap works but the x64 DMG and its hash are still missing. The macOS
DMG can be distributed directly from GitHub Releases with a Gatekeeper warning.

> Naming gotcha: `dist:mac:public` in `package.json` still emits
> `LV24 WiFi Explorer-<version>-<arch>-public.dmg` (spaces), while the v1.0.0
> release, `README.md` and the Homebrew cask use the hyphenated
> `LV24-WiFi-Explorer-<version>-<arch>-public.dmg`. Rename the file before
> uploading (or align `-c.artifactName`) so cask URLs and docs do not drift.
> The published `checksums.txt` already has the standard `sha256sum` format and
> the arm64 hash (`b445127c…97ca`), so the cask's `on_arm` block is filled.

## Matrix

| Publisher                        | Platform      | Artifact                        | Cost                                                                  | Account needed                    | Automation                                                                 | Blocker                                                                                                                             |
| -------------------------------- | ------------- | ------------------------------- | --------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| GitHub Releases                  | win/mac/linux | `.exe` `.dmg` `.AppImage`       | $0                                                                    | repo write                        | `release-desktop.yml` (manual, opt-in upload)                              | none — Windows/Linux assets attached 2026-11-10                                                                                     |
| winget (`microsoft/winget-pkgs`) | Windows       | `.exe` (NSIS)                   | $0                                                                    | GitHub + Microsoft CLA            | PR [#475989](https://github.com/microsoft/winget-pkgs/pull/475989), manual | CLA signed; Installation Validation fails (`shellExecute`)                                                                          |
| Scoop (self-hosted bucket)       | Windows       | `.exe`                          | $0                                                                    | GitHub                            | live: [scoop-bucket](https://github.com/LevapVeeskela/scoop-bucket)        | none                                                                                                                                |
| Chocolatey (community repo)      | Windows       | `.nupkg`                        | $0                                                                    | free Chocolatey account + API key | `choco pack` / `choco push`, manual                                        | free account + moderation                                                                                                           |
| Snap Store                       | Linux         | `.snap`                         | $0                                                                    | Ubuntu One                        | not wired up                                                               | `nmcli` cannot run in a confined snap                                                                                               |
| Flathub                          | Linux         | Flatpak                         | $0                                                                    | GitHub                            | reference skeleton only                                                    | offline source build, `nmcli`, metainfo, MUI licensing, human-authored manifest                                                     |
| AppImageHub                      | Linux         | `.AppImage`                     | $0                                                                    | GitHub                            | one-line data file + PR                                                    | AppImage exists; built on 24.04, so switch to 22.04 before the PR                                                                   |
| Homebrew Cask                    | macOS         | `.dmg`                          | $0 in a tap; $99/yr for `homebrew/cask`                               | GitHub                            | cask in `packaging/homebrew/`                                              | notarization required by Homebrew policy                                                                                            |
| Microsoft Store                  | Windows       | signed MSI/EXE (NSIS), not MSIX | $0 registration + $0 via SignPath Foundation (publisher name changes) | Partner Center                    | see linked doc                                                             | on hold: no free trusted certificate; listing draft ready; see [`DISTRIBUTION-MICROSOFT-STORE.md`](DISTRIBUTION-MICROSOFT-STORE.md) |

## Building the assets

`.github/workflows/release-desktop.yml` is `workflow_dispatch`-only and never
creates a release. Standard GitHub-hosted runners on a public repository are free,
so a run costs nothing. It builds the ref you dispatch from (normally `master`),
not the old release tag, and a preflight job fails when `package.json` no longer
matches the tag — the tag only selects which release receives the assets.

```bash
# UI: Actions -> "Release desktop artifacts" -> Run workflow
# CLI equivalent:
gh workflow run release-desktop.yml -f tag=v1.0.3 -f upload=false
gh run watch
gh run download --name desktop-release-bundle
```

It produces, with stable URL-safe names (run on 2026-11-10 for `v1.0.3`):

| File                                             | Built by                                                    |
| ------------------------------------------------ | ----------------------------------------------------------- |
| `LV24-WiFi-Explorer-1.0.3-win-x64.exe`           | `windows-latest`, `yarn dist:win`                           |
| `LV24-WiFi-Explorer-1.0.3-linux-x86_64.AppImage` | `ubuntu-latest`, `yarn dist:linux --x64`                    |
| `SHA256SUMS.txt`                                 | merged from both jobs and verified with `sha256sum --check` |

The macOS DMG keeps its existing hyphenated name
(`LV24-WiFi-Explorer-<version>-<arch>-public.dmg`) because `dist:mac:public` is
unchanged. With `upload=true` the workflow attaches the three files to the
existing release with `gh release upload --clobber`; it fails if the release does
not exist. The release keeps its original `checksums.txt`; the workflow adds a
separate `SHA256SUMS.txt` for the artifacts it builds.

Unsigned builds are intentional: no certificate is bought, so Windows shows a
SmartScreen prompt and macOS requires the Gatekeeper "Open Anyway" flow. Linux has
no signature at all. Say so in release notes instead of hiding it.

### Checksum handoff

```bash
node scripts/packaging/fill-checksums.mjs release/LV24-WiFi-Explorer-1.0.3-win-x64.exe
# prints the hash + the three exact lines; --write applies them:
node scripts/packaging/fill-checksums.mjs release/LV24-WiFi-Explorer-1.0.3-win-x64.exe --write
```

## winget

Manifests: [`packaging/winget/`](../packaging/winget), `ManifestVersion 1.28.0`,
`InstallerType: nullsoft`, `Scope: user`, `UpgradeBehavior: install`. Notes and
the PR layout are in [`packaging/winget.md`](../packaging/winget.md); keep that
file **outside** `packaging/winget/`, because `winget validate` parses every file
in the directory it is given.

Current schema facts (verified 2026-11-10): the winget-pkgs PR template asks new
submissions to conform to the **1.28** schema
(`aka.ms/winget-manifest.*.1.28.0.schema.json`); 1.12.0 appears in older merged
manifests but is not the right choice for a new package. `nullsoft` makes
winget pass `/S` itself; `Scope: user` matches electron-builder's
`perMachine: false`. The validation pipeline installs as a standard user, so a
per-user installer is required, and it verifies the SHA-256 and silent install.

```powershell
# 1. Windows asset must be attached to the release first.
# 2. Fill the hash and validate locally.
node scripts/packaging/fill-checksums.mjs release\LV24-WiFi-Explorer-1.0.0-win-x64.exe --write
winget validate --manifest packaging\winget
winget settings --enable LocalManifestFiles
winget install --manifest packaging\winget

# 3. Copy into a fork of microsoft/winget-pkgs at
#    manifests/l/LV24/WiFiExplorer/1.0.0/ and open one PR for that version.
```

Acceptance notes: unsigned installers are allowed (there is no signing policy in
`winget-pkgs`); the URL must be HTTPS, version-specific and come from the
publisher, and the installer must not be flagged by the security scan. A
Microsoft CLA signature is required once, free.

## Scoop

Manifest: [`packaging/scoop/lv24-wifi-explorer.json`](../packaging/scoop/lv24-wifi-explorer.json)
for a **self-hosted bucket** (`<owner>/scoop-bucket`, `bucket/` layout).

The manifest extracts the electron-builder payload (`#/dl.7z` +
`$PLUGINSDIR/app-64.7z`) instead of running the NSIS installer, which is the
pattern `ScoopInstaller/Extras` uses for Obsidian/Joplin/Signal. Running the
installer would put the app outside `$dir` and leave files behind on uninstall.
See [`packaging/scoop/README.md`](../packaging/scoop/README.md) for the rejected
`installer`/`uninstaller` variant.

```powershell
scoop bucket add lv24 https://github.com/<owner>/scoop-bucket
scoop install lv24/lv24-wifi-explorer
```

Do not PR this into `ScoopInstaller/Main` or `Extras`; those buckets are curated
and have their own criteria.

## Chocolatey

Package: [`packaging/chocolatey/`](../packaging/chocolatey). Downloads the
versioned release asset, verifies `checksum64`, runs `/S`. AutoUninstaller handles
removal; `chocolateyUninstall.ps1` is the explicit fallback resolved from the ARP
registry entry.

```powershell
choco pack packaging\chocolatey\lv24-wifi-explorer.nuspec
choco apikey --key <API_KEY> --source https://push.chocolatey.org/
choco push lv24-wifi-explorer.1.0.0.nupkg --source https://push.chocolatey.org/
```

Account and API key are free. Moderation is human and can take days. Because
Chocolatey always runs elevated, a per-user NSIS build installs into the profile of
the account running `choco` — mention it if reviewers ask.

## Snap Store

Not published. See [`packaging/snap/README.md`](../packaging/snap/README.md).

`packages/backend/src/providers/linux.ts` shells out to `nmcli`, which does not
exist inside a strictly confined snap. A snap published today would fall back to
the demo provider. Fix the provider (NetworkManager D-Bus + `--system-talk-name`)
before adding `snap` to `electron-builder.yml`; `confinement: classic` needs store
approval and is unlikely to be granted for a use case that D-Bus can serve.

Publishing itself is free: an Ubuntu One account, `snapcraft register`, then
`snapcraft upload --release=stable`.

## Flathub

Not ready, not submitted. See [`packaging/flathub/README.md`](../packaging/flathub/README.md)
for the gap list: offline dependency graph (`flatpak-node-generator`), source-only
build, NetworkManager D-Bus rewrite, AppStream metainfo, desktop/icon renaming,
and the MUI X Pro licensing question.

Two policy points worth repeating: Flathub forbids AI-generated or AI-assisted
manifests, and AI agents must not open the submission PR. The YAML in
`packaging/flathub/` is a structural reference for a human to rewrite.

## AppImageHub

Free catalogue, no account beyond GitHub, no hosting. See
[`packaging/appimagehub/README.md`](../packaging/appimagehub/README.md).

Submit one file `data/LV24_WiFi_Explorer` in a fork of
`AppImage/appimage.github.io` containing one line:

```
https://github.com/LevapVeeskela/lv24-Wifi-Explorer
```

Metadata comes from the AppImage's own desktop file/AppStream data. The catalogue
test runs the app offline on the oldest supported Ubuntu LTS, so an AppImage built
on `ubuntu-latest` (24.04) fails with `error-glibc-too-new`. Switch the workflow's
Linux job to `runs-on: ubuntu-22.04` (still free) before submitting, or accept the
failure and keep the AppImage GitHub-only.

## Homebrew Cask

`homebrew/cask` requires Gatekeeper to pass on a default macOS configuration,
which means a Developer ID signature **and** notarization
(`docs/Acceptable-Casks.md` in `Homebrew/brew`). Notarization requires the paid
Apple Developer Program, so this channel is out under the zero-spend policy.

What is possible at $0: a self-hosted tap with the cask in
[`packaging/homebrew/lv24-wifi-explorer.rb`](../packaging/homebrew/lv24-wifi-explorer.rb).
Users must clear quarantine manually once. The cask also needs an uploaded x64 DMG
before the `on_intel` block can be filled.

## Zero-spend rules for this area

- Workflows stay `workflow_dispatch`-only. No `push`, `pull_request`, `schedule`
  or `release` triggers; a tag push or a published release starts nothing.
- Standard `ubuntu-*` / `windows-*` / `macos-*` hosted runners only. No larger
  runners, no matrices that multiply jobs without a reason.
- No paid certificates or accounts. Artifacts ship unsigned by default; the
  Microsoft Store path needs an Authenticode certificate and can stay at $0 only
  through SignPath Foundation (publisher name changes) — see
  [`DISTRIBUTION-MICROSOFT-STORE.md`](DISTRIBUTION-MICROSOFT-STORE.md).
- No paid store accounts, no paid "priority review", no paid CDN.
- Every submission in this document is a human action. Nothing in this repository
  pushes to a package registry or opens a PR automatically.

## Sources (accessed 2026-11-10)

| Topic                                                      | Source                                                                                                                                                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| winget manifest schema, fields, switches                   | <https://learn.microsoft.com/en-us/windows/package-manager/package/manifest> (updated 2026-09-14), <https://github.com/microsoft/winget-pkgs/blob/master/doc/manifest/schema/1.28.0/installer.md> |
| winget validation pipeline                                 | <https://github.com/microsoft/winget-pkgs/blob/master/doc/Validation.md>                                                                                                                          |
| winget repository policies                                 | <https://github.com/microsoft/winget-pkgs/blob/master/doc/Policies.md>                                                                                                                            |
| Scoop manifest fields                                      | <https://github.com/ScoopInstaller/Scoop/wiki/App-Manifests>                                                                                                                                      |
| Chocolatey install/uninstall helpers                       | <https://docs.chocolatey.org/en-us/create/functions/install-chocolateypackage>, <https://docs.chocolatey.org/en-us/create/functions/uninstall-chocolateypackage>                                  |
| Chocolatey validator rules                                 | <https://docs.chocolatey.org/en-us/community-repository/moderation/package-validator/>                                                                                                            |
| Snap confinement / classic approval                        | <https://snapcraft.io/docs/snap-confinement>                                                                                                                                                      |
| Flathub requirements (no network, source build, AI policy) | <https://docs.flathub.org/docs/for-app-authors/requirements>                                                                                                                                      |
| Flathub submission process                                 | <https://docs.flathub.org/docs/for-app-authors/submission>                                                                                                                                        |
| AppImageHub submission rules                               | <https://github.com/AppImage/appimage.github.io> (README)                                                                                                                                         |
| Homebrew Gatekeeper requirement                            | <https://github.com/Homebrew/brew/blob/main/docs/Acceptable-Casks.md>, <https://github.com/Homebrew/brew/blob/main/docs/Homebrew-Security-and-Supply-Chain.md>                                    |

## What the owner must do

1. ~~Run the release workflow for `v1.0.0`~~ — done on 2026-11-10; `v1.0.3` is
   the current release of record with `SHA256SUMS.txt` attached.
2. Optionally upload the x64 macOS DMG if Intel Macs should be supported.
3. ~~Fill checksums~~ — done for `v1.0.3`; re-run
   `scripts/packaging/fill-checksums.mjs <exe> --write` for every new version.
4. CLA on [PR #475989](https://github.com/microsoft/winget-pkgs/pull/475989) is signed. Installation Validation is blocked by `shellExecute`; the PR still carries 1.0.0. Retry with a signed `v1.0.3` or a different installer type, do not change the manifest blindly.
5. ~~Create `<owner>/scoop-bucket` and push the manifest~~ — live at
   [LevapVeeskela/scoop-bucket](https://github.com/LevapVeeskela/scoop-bucket).
6. Create a free Chocolatey account, pack and push.
7. Optionally: AppImageHub PR (rebuild on `ubuntu-22.04` first).
8. Microsoft Store: choose Certum OSS (EUR 49, paid) or an MSIX build ($0 but a
   separate packaging project); the listing draft is ready, submission is on hold.
9. Decide on Apple notarization ($99/yr) - it unblocks `homebrew/cask` and removes
   the Gatekeeper warning.
10. Fix the Linux provider if Snap/Flathub matter; until then those two channels
    stay documented as blocked.

Expected cost for steps 1–7 and 9–10: **$0**. Store is the only paid branch
(Certum EUR 49+), unless the MSIX path is taken.
