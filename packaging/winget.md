# winget manifests

Three files, one package version, targeting the community repository
`microsoft/winget-pkgs`.

This note lives **outside** `packaging/winget/` on purpose: `winget validate`
parses every file in the directory it is given, whatever the extension, so a
`README.md` next to the manifests makes validation fail with a YAML scanner error.

| File                                  | Manifest type  |
| ------------------------------------- | -------------- |
| `LV24.WiFiExplorer.yaml`              | version        |
| `LV24.WiFiExplorer.installer.yaml`    | installer      |
| `LV24.WiFiExplorer.locale.en-US.yaml` | default locale |

Schema: `ManifestVersion 1.28.0`, referenced through the `aka.ms` URLs in each
file's `yaml-language-server` header. That is what the winget-pkgs PR template
asks new submissions to use; 1.12.0 is the older schema still found in existing
manifests.

Installer facts that matter for validation:

- `InstallerType: zip` + `NestedInstallerType: portable` — winget extracts the
  archive with the system `tar` and creates a portable shim; it does not launch
  the unsigned NSIS installer, which the validation VM rejects with
  `shellExecute`.
- `NestedInstallerFiles` names `LV24 WiFi Explorer.exe` with the
  `lv24-wifi-explorer` alias.
- Portable packages are per-user; `Scope` is not allowed and must be omitted.
- `UpgradeBehavior: install` — winget replaces the portable payload in place.
- `ReleaseDate: 2026-11-10` — date of the current 1.0.4 release.

The NSIS `LV24-WiFi-Explorer-1.0.4-win-x64.exe` stays on the release for direct
downloads and Scoop; winget uses the ZIP only.

## Before submitting

```powershell
# 1. The ZIP must exist on the release and the hash must be real.
(Get-FileHash release\LV24-WiFi-Explorer-1.0.4-win-x64.zip -Algorithm SHA256).Hash.ToLower()

# 2. Local validation (winget is part of App Installer on Windows 10/11).
winget validate --manifest packaging\winget

# 3. Optional: install from the local manifest.
winget settings --enable LocalManifestFiles
winget install --manifest packaging\winget
```

## Submit

1. Fork `microsoft/winget-pkgs` and sign the Microsoft CLA (free, one time).
2. Copy the three files to
   `manifests/l/LV24/WiFiExplorer/1.0.4/` (first letter of the publisher id,
   case-sensitive publisher and package folders, version folder).
3. Open **one** PR for that single version. The validation app runs ten checks:
   schema, URL reachability, URL ownership, policy, catalog consistency, malware
   scan, silent install as a standard user, installer metadata.
4. Fix what the bot reports. Do not mix README or tooling changes into the PR.

Unsigned installers are accepted — there is no signing policy — but the installer
must install silently, must come from a version-specific HTTPS URL on the
publisher's own release page, and must not be flagged as PUA.

## Bitness

If a Windows arm64 build is added later, add another `Installers` entry with
`Architecture: arm64` and its own `InstallerUrl`/`InstallerSha256`; do not reuse
the x64 asset.
