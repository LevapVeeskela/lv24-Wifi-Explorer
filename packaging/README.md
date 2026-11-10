# packaging

Publisher manifests and notes for the free distribution channels. Nothing in
this directory builds or publishes anything by itself; it is input for the manual
submission steps in [`docs/DISTRIBUTION.md`](../docs/DISTRIBUTION.md).

| Directory      | Target                     | State                                                                                                                    |
| -------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `winget/`      | Windows Package Manager    | PR [#475989](https://github.com/microsoft/winget-pkgs/pull/475989) open; 1.0.4 portable ZIP manifest, validation pending |
| `scoop/`       | self-hosted Scoop bucket   | live: [LevapVeeskela/scoop-bucket](https://github.com/LevapVeeskela/scoop-bucket)                                        |
| `chocolatey/`  | community.chocolatey.org   | ready to pack: hash filled; free account and moderation                                                                  |
| `snap/`        | Snap Store                 | blocked: `nmcli` cannot run in a confined snap                                                                           |
| `flathub/`     | Flathub                    | blocked: offline source build + `nmcli` + metainfo missing                                                               |
| `appimagehub/` | AppImageHub catalogue      | AppImage exists; rebuild on 22.04 before the PR (glibc caveat)                                                           |
| `homebrew/`    | Homebrew (self-hosted tap) | blocked for `homebrew/cask` by notarization; x64 DMG and hash still missing                                              |

All manifests are pinned to version `1.0.0` except Scoop and winget, which are
at `1.0.4`. Chocolatey and the Homebrew cask still target 1.0.0 until they are
repacked or rebuilt. The 1.0.0 checksums are filled from
the published asset; future versions use the shared placeholder
`REPLACE_WITH_SHA256`, which one command replaces:

```bash
node scripts/packaging/fill-checksums.mjs release/LV24-WiFi-Explorer-1.0.0-win-x64.exe --write
```

The only supported path to get that file is the manual workflow
[`.github/workflows/release-desktop.yml`](../.github/workflows/release-desktop.yml).
