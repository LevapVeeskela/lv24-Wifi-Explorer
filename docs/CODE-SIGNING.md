# Code signing policy

LV24 WiFi Explorer uses the [SignPath Foundation](https://signpath.org/) program
for free code signing of its open-source Windows builds, once the project is
accepted into the program.

## What is signed

- The Windows NSIS installer `LV24-WiFi-Explorer-<version>-win-x64.exe`.
- The Electron executables and helper binaries inside that installer.

macOS and Linux artifacts are not signed by SignPath. macOS signing/notarization
requires an Apple Developer ID certificate and is documented in
[`RELEASE.md`](RELEASE.md). Linux AppImages are unsigned.

## Build and approval process

1. A release is built from a tagged commit in this public repository by
   `.github/workflows/release-desktop.yml`.
2. The Windows job runs on a GitHub-hosted `windows-latest` runner, without a
   commercial MUI key (`check:public-bundle` enforces this).
3. The resulting installer is submitted to SignPath for signing; every signing
   request is approved manually by the maintainer.
4. The signed installer and `SHA256SUMS.txt` are attached to the GitHub Release.
5. Users can verify the Authenticode signature and compare the SHA-256 with the
   release checksums.

## People

- Maintainer, reviewer and signing approver: **Pavel Aliakseyeu**
  ([@LevapVeeskela](https://github.com/LevapVeeskela)).

There are no other committers with release rights. Changes to the release
workflow or signing configuration require the maintainer's review.

## Reproducibility and provenance

- Source, build workflow and release assets are public.
- Builds are made from the tagged commit; the workflow records the commit SHA.
- No prebuilt binaries from third parties are added to the installer.
- The public build is keyless by construction: CI has no `.env.local` and runs
  `yarn check:public-bundle` before packaging.

## Verification

```powershell
Get-AuthenticodeSignature .\LV24-WiFi-Explorer-<version>-win-x64.exe
Get-FileHash .\LV24-WiFi-Explorer-<version>-win-x64.exe -Algorithm SHA256
```

Compare the hash with `SHA256SUMS.txt` from the same GitHub Release.

## Contact

Security or signing questions: **support@lv24.by** or the repository issue
tracker.
