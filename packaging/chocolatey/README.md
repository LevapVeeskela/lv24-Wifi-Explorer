# Chocolatey package

Community-repository package (community.chocolatey.org). No paid tier is
involved: an account and an API key are free.

## Layout

| File                               | Purpose                                                 |
| ---------------------------------- | ------------------------------------------------------- |
| `lv24-wifi-explorer.nuspec`        | metadata + `tools/` payload                             |
| `tools/chocolateyinstall.ps1`      | downloads the release asset, verifies SHA-256, runs `/S` |
| `tools/chocolateyUninstall.ps1`    | fallback uninstaller resolved from the ARP registry key  |

The package does **not** embed the installer (no redistribution of binaries, no
`VERIFICATION.txt` needed): it downloads the versioned GitHub release asset and
verifies the checksum, which is what CPMR0073 asks for.

## Steps

```powershell
# 1. Fill the checksum after the Windows artifact exists
node scripts/packaging/fill-checksums.mjs release\LV24-WiFi-Explorer-1.0.0-win-x64.exe --write

# 2. Pack and inspect
choco pack packaging\chocolatey\lv24-wifi-explorer.nuspec
choco install lv24-wifi-explorer --source . --yes
choco uninstall lv24-wifi-explorer --yes

# 3. Push (free account + API key from https://community.chocolatey.org/account)
choco apikey --key <API_KEY> --source https://push.chocolatey.org/
choco push lv24-wifi-explorer.1.0.0.nupkg --source https://push.chocolatey.org/
```

`choco push` is a manual, human action on purpose: the repository is moderated
and automated pushes from CI are out of scope for the zero-spend setup.

## Moderation notes

- `Install-ChocolateyPackage` requires admin, so the package installs into the
  profile of the account running `choco` (the electron-builder NSIS build is
  `perMachine: false`). Mention this in the package description if reviewers ask.
- CPMR0068 wants `authors` to match the repository maintainer account. If the
  Chocolatey account is not `LV24`, align the nuspec before pushing.
- CPMR0076 forbids `raw.githubusercontent.com` icons; the nuspec uses jsDelivr.
- The installer is unsigned. Chocolatey's virus scanner and moderation will still
  accept it, but users see a SmartScreen prompt on first launch.
