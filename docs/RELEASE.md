# Release / distribution

Production packaging for LV24 WiFi Explorer (Electron desktop) plus the
Flutter/Dart side artifacts. Nothing here spends money: CI stays manual-only
and releases are manual uploads.

Canonical version lives in the root `package.json` (`version`). The Flutter app
has its own `flutter/pubspec.yaml` version (`1.0.4+5`). The npm packages and the
PyPI launcher have independent patch versions (`packages/*/package.json`,
`python/pyproject.toml`): the packages stay at `1.0.1` while the desktop app is
at `1.0.4`.

---

## 0. Preconditions (one-time per machine)

> No Apple Developer account yet? Build a signed local artifact with
> `yarn dist:mac:dir` and distribute it as a **pre-release**. Gatekeeper will
> require the user to allow the app manually; public production distribution
> must wait for notarization credentials.

| Item            | Requirement                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Node / Yarn     | Node ≥ 20, Yarn 1.22.22 (`packageManager`)                                                        |
| macOS toolchain | Xcode **or** Command Line Tools; `lipo`, `codesign`, `xcrun`, `notarytool`                        |
| ScanCore        | universal binary ([`native/ScanCore`](../native/ScanCore))                                        |
| Signing         | `Developer ID Application: … (TEAMID)` in the login keychain, or `CSC_LINK` + `CSC_KEY_PASSWORD`  |
| Notarization    | `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` in the environment (never in the repo) |
| MUI X Pro       | `VITE_MUI_LICENSE_KEY` in `.env.local` only (needed for the watermark-free grid)                  |
| Windows         | Windows host (or a runner with wine) for `dist:win` — `signAndEditExecutable` needs rcedit        |

Verify identities:

```bash
security find-identity -v -p codesigning
```

> **Apple Development is not enough.** If the only identity is
> `Apple Development: …`, the build signs and runs on this machine but Gatekeeper
> rejects it elsewhere and `notarytool` cannot notarize it. A distributable
> release needs `Developer ID Application: … (TEAMID)`, which requires a paid
> Apple Developer Program membership. Confirm before shipping:
>
> ```bash
> codesign -dv --verbose=4 "release/mac-arm64/LV24 WiFi Explorer.app" 2>&1 | grep Authority
> # expected: Authority=Developer ID Application: …
> ```
>
> `spctl -a -vvv -t exec` must say `accepted, source=Notarized Developer ID`;
> `rejected` means the artifact is local-only.

---

## 1. Version bump

1. Root `package.json` → `"version": "X.Y.Z"`.
2. `flutter/pubspec.yaml` → `version: X.Y.Z+N` (build number increments).
3. Add a `## [X.Y.Z] — YYYY-MM-DD` section to [`CHANGELOG.md`](../CHANGELOG.md).
4. Commit: `[Wifi](release) X.Y.Z`.

---

## 1a. MUI key in private and release builds

The key is never stored in source. Local builds read it from `.env.local`
(gitignored); release builds read `MUI_X_LICENSE_KEY` from GitHub Actions
secrets. `vite.config.ts` replaces the env access with a random placeholder and
injects a XOR-coded decoder after minification, so the plaintext key is not
greppable in `dist/` or `app.asar`. This is obfuscation, not encryption: the
decoder ships in the bundle and a debugger can still recover the key.

| Command                | MUI key                    | Watermark | Redistributable       |
| ---------------------- | -------------------------- | --------- | --------------------- |
| `yarn dist:mac`        | `.env.local`, coded        | no        | private               |
| `yarn dist:mac:dir`    | `.env.local`, coded        | no        | private               |
| `yarn dist:mac:public` | forced empty               | yes       | yes                   |
| `release-desktop.yml`  | `MUI_X_LICENSE_KEY` secret | no        | yes (key recoverable) |

`check:public-bundle` fails if the **plaintext** key appears anywhere in `dist/`;
it is the guard that proves the codec ran. `dist:mac:public` sets
`VITE_MUI_LICENSE_KEY=` and still runs the guard, so the public DMG is keyless
and watermarked. The public DMG stays unsigned until a Developer ID Application
identity and notarization are available.

The release workflow requires the `MUI_X_LICENSE_KEY` secret in its preflight
job and aborts if it is missing, so a release cannot silently ship a watermarked
UI. The key is still present in the final artifact (encoded); publishing the
installer means publishing the key to anyone who runs a decoder. Do not attach a
locally built installer to a public release: use the workflow, which is
reproducible and records the secret source.

---

## 2. Build all packages and artifacts

```bash
yarn install --frozen-lockfile
yarn format:check && yarn typecheck && yarn lint && yarn check:boundaries && yarn test
yarn build          # packages + desktop main/preload + renderer
yarn smoke:dist     # CSP + bundles + preload isolation
```

ScanCore must be universal (`arm64` + `x86_64`) before packaging:

```bash
yarn build:scancore     # Swift helper, ad-hoc/Developer ID signed
yarn check:scancore     # fails unless lipo reports arm64 AND x86_64
```

If `check:scancore` fails, the machine is on the host-arch `swiftc` fallback:
accept the Xcode license (`sudo xcodebuild -license accept`) or build both
architectures and `lipo -create` them. `dist:mac` runs this preflight
automatically — a broken helper cannot ship silently.

Flutter (optional per release): `dart pub get` at the repo root, then
`cd flutter && flutter build macos|apk|ios`.

---

## 3. Package (macOS)

Local packaging smoke (no DMG, fast, no notarization):

```bash
yarn dist:mac:dir
open release/mac*/LV24\ WiFi\ Explorer.app   # Gatekeeper check below
```

Distributable:

```bash
export APPLE_ID="release@example.com"          # Apple ID, not a secret
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="TEAMID1234"
yarn dist:mac                                  # DMG for x64 + arm64
```

- `mac.notarize: true` in `electron-builder.yml`; credentials come only from
  the env vars above. Without them electron-builder logs
  `skipped macOS notarization` and the build is simply unsigned/unnotarized.
- Hardened runtime stays on; the app and the `ScanCore` helper are signed with
  their own entitlements (`entitlements.mac.plist`,
  `native/ScanCore/ScanCore.entitlements`).
- Apple may need a few minutes to publish the ticket; `xcrun stapler validate`
  on the DMG catches a missing ticket.
- Disable notarization for one run with `... electron-builder --mac dmg -c.mac.notarize=false`.

Other targets:

```bash
yarn dist:win     # NSIS + portable ZIP x64, run on Windows; unsigned works for direct downloads and winget,
                  # but a Microsoft Store MSI/EXE submission must be CA-signed
yarn dist:linux   # AppImage x64 + arm64 (`--x64` for one architecture)
```

The free distribution channels and their prerequisites are in
[`DISTRIBUTION.md`](DISTRIBUTION.md); the Microsoft Store specifics are in
[`DISTRIBUTION-MICROSOFT-STORE.md`](DISTRIBUTION-MICROSOFT-STORE.md).

---

## 4. Verify the artifact (Gatekeeper + smoke)

```bash
APP="release/mac-arm64/LV24 WiFi Explorer.app"

# 1. Signature, hardened runtime, entitlements
codesign --verify --deep --strict --verbose=2 "$APP"
codesign -dv --entitlements :- "$APP" 2>&1 | head -30
spctl -a -vvv -t exec "$APP"           # expect "accepted, source=Notarized Developer ID"

# 2. Helper signature and universal arch
lipo -info "$APP/Contents/Resources/ScanCore.app/Contents/MacOS/ScanCore"
codesign --verify --deep --strict --verbose=2 "$APP/Contents/Resources/ScanCore.app"

# 3. Notarization ticket (DMG)
xcrun stapler validate release/*.dmg

# 4. Real launch on a clean macOS 13.5+ account/machine
open "$APP"
```

Manual acceptance checks on the packaged app:

- [ ] Live scan works after granting **Location** to `ScanCore` (no demo badge).
- [ ] Deny Location → demo fixtures + visible badge, no crash.
- [ ] Snapshot open/save (`.lv24scan`), CSV export, print.
- [ ] Grid has no MUI watermark (license key baked into the renderer build).
- [ ] Quit/relaunch is clean; app bundle is not in a quarantine-bypass path.

Windows/Linux artifacts: install, launch, `yarn cli providers`, verify live scan
or documented demo fallback on real hardware.

---

## 5. CI

`.github/workflows/ci.yml` is **manual-only** (`workflow_dispatch`) on a
standard GitHub-hosted runner: install, typecheck, lint, format check, tests,
CLI smoke, `yarn build`. It does not publish artifacts, sign, or notarize.

Two more workflows are manual-only and also use standard free public-repo
runners: `release-desktop.yml` builds unsigned Windows NSIS + portable ZIP + Linux AppImage
assets (optionally attaches them to an existing release) and `pypi-publish.yml`
publishes the Python launcher. Do not add paid runners, larger runners, or
automatic push/PR triggers (zero-spend policy).

---

## 6. Publish

1. Tag: `git tag vX.Y.Z && git push origin vX.Y.Z` (the tag alone triggers no
   workflow; the release does).
2. Attach `release/*.dmg` (and `*.exe`/`*.AppImage`) to the GitHub Release, with
   the `CHANGELOG.md` section as notes. Windows/Linux assets can be built by the
   manual [`release-desktop.yml`](../.github/workflows/release-desktop.yml)
   workflow (`upload=true` attaches them to an existing release).
3. Publishing the GitHub Release also runs `pypi-publish.yml`
   (`lv24-wifi-explorer`); that workflow skips a version already on PyPI. Both
   workflows use standard free runners of this public repository.
4. Note the absence of an auto-updater: users re-download manually.
5. Free third-party channels (winget, Scoop, Chocolatey, AppImageHub, Flathub,
   Snap) are prepared in [`packaging/`](../packaging); submission is manual and
   tracked in [`DISTRIBUTION.md`](DISTRIBUTION.md).
6. Record a `brain handoff` with the shipped version and hashes.

---

## Troubleshooting

| Symptom                                              | Fix                                                                                       |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `[check-scancore] ScanCore is not universal`         | Xcode license not accepted → universal `swift build`; see §2                              |
| `skipped macOS notarization`                         | env vars missing (expected for unsigned builds)                                           |
| Notarization `invalid` — unsigned                    | set a Developer ID identity (`CSC_LINK` or keychain)                                      |
| App launches with demo badge                         | Location denied for `ScanCore`, or helper not signed/embedded — see `docs/PERMISSIONS.md` |
| `spctl` rejects                                      | ticket not stapled yet, or signature broken — re-run §3/§4                                |
| Windows build fails on macOS with rcedit/wine errors | build `dist:win` on Windows (`signAndEditExecutable: true` needs rcedit)                  |
