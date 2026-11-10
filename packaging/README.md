# packaging

Publisher manifests and notes for the free distribution channels. Nothing in
this directory builds or publishes anything by itself; it is input for the manual
submission steps in [`docs/DISTRIBUTION.md`](../docs/DISTRIBUTION.md).

| Directory      | Target                     | State                                                                             |
| -------------- | -------------------------- | --------------------------------------------------------------------------------- |
| `winget/`      | Windows Package Manager    | ready to submit after the Windows asset exists + hash filled ([notes](winget.md)) |
| `scoop/`       | self-hosted Scoop bucket   | ready after the bucket repo exists + hash filled                                  |
| `chocolatey/`  | community.chocolatey.org   | ready to pack after the hash is filled                                            |
| `snap/`        | Snap Store                 | blocked: `nmcli` cannot run in a confined snap                                    |
| `flathub/`     | Flathub                    | blocked: offline source build + `nmcli` + metainfo missing                        |
| `appimagehub/` | AppImageHub catalogue      | ready after an AppImage release exists (glibc caveat)                             |
| `homebrew/`    | Homebrew (self-hosted tap) | blocked for `homebrew/cask` by notarization                                       |

All manifests are pinned to version `1.0.0` and use a shared placeholder,
`REPLACE_WITH_SHA256`, so one command fills the checksums:

```bash
node scripts/packaging/fill-checksums.mjs release/LV24-WiFi-Explorer-1.0.0-win-x64.exe --write
```

The only supported path to get that file is the manual workflow
[`.github/workflows/release-desktop.yml`](../.github/workflows/release-desktop.yml).
