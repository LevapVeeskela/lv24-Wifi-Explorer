# Scoop manifest

`lv24-wifi-explorer.json` is the manifest for a **self-hosted Scoop bucket**.
Scoop's main/extras buckets are curated by their maintainers; a bucket in this
repository (or a dedicated `scoop-bucket` repo) keeps the release in the owner's
hands at zero cost. Nothing here is submitted to `ScoopInstaller/*`.

## Why the manifest extracts instead of running the installer

The Windows artifact is an electron-builder NSIS installer. Scoop *can* run it
with the documented `installer` / `uninstaller` blocks, but that is the wrong
shape for this app:

- NSIS installs into `%LOCALAPPDATA%\Programs\LV24 WiFi Explorer`, i.e. **outside**
  `$dir`. `scoop uninstall` only cleans `$dir`, and the `uninstaller` block cannot
  reference the external path through `$dir`, so files would be left behind.
- Scoop's convention is to keep an app inside `~/scoop/apps/<app>/current`.

So the manifest uses the established Scoop pattern for electron-builder apps
(the same one `ScoopInstaller/Extras` uses for Obsidian, Joplin and Signal):

1. Download the `.exe` as `dl.7z` (`#/dl.7z`).
2. `pre_install` unpacks the inner `$PLUGINSDIR/app-64.7z`, which holds the app
   files (`LV24 WiFi Explorer.exe`, `resources/`, …), into `$dir`.

This requires the NSIS build to keep 7z compression, which is electron-builder's
default (`compression: normal`). Setting `compression: store` would remove
`app-64.7z` and break the manifest.

### The `installer` variant, for reference only

```json
"installer": {
  "file": "LV24-WiFi-Explorer-1.0.0-win-x64.exe",
  "args": ["/S"]
},
"uninstaller": {
  "script": "& \"$env:LOCALAPPDATA\\Programs\\LV24 WiFi Explorer\\Uninstall LV24 WiFi Explorer.exe\" /S"
}
```

This works but leaves the app outside Scoop's directory and depends on the exact
per-user install path. Do not use it for the bucket manifest.

## Publish the bucket

```powershell
# 1. Create the bucket repo (public, free): <owner>/scoop-bucket
#    Layout: bucket/lv24-wifi-explorer.json
git clone https://github.com/<owner>/scoop-bucket
mkdir scoop-bucket\bucket
copy packaging\scoop\lv24-wifi-explorer.json scoop-bucket\bucket\
git -C scoop-bucket add bucket/lv24-wifi-explorer.json
git -C scoop-bucket commit -m "lv24-wifi-explorer 1.0.0"
git -C scoop-bucket push
```

Users then run:

```powershell
scoop bucket add lv24 https://github.com/<owner>/scoop-bucket
scoop install lv24/lv24-wifi-explorer
```

## Checksum

`hash` must be the SHA-256 of the `.exe` **as downloaded from the release**, not
of the extracted files:

```powershell
node scripts/packaging/fill-checksums.mjs release\LV24-WiFi-Explorer-1.0.0-win-x64.exe --write
```

`autoupdate` reads the release's `SHA256SUMS.txt`, which the release workflow
generates. `checkver` uses the GitHub releases API (no token needed for a public
repo).

## Caveats

- Unsigned installer: SmartScreen warns on first run. Scoop does not bypass that.
- The bucket is unofficial. Do not open PRs against `ScoopInstaller/Main` or
  `ScoopInstaller/Extras` for this manifest — they have their own criteria
  (notably: no Electron wrapper apps in Main, and Extras requires a manual
  review of the app itself).
