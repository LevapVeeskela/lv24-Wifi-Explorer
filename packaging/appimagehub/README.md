# AppImageHub (appimage.github.io)

AppImageHub is a catalogue, not a store: it links to the author's own download
page and keeps no copies. Listing is free and has no account requirement beyond
a GitHub account for the PR.

## What the catalogue reads

There is no metadata form. The test downloads the newest release AppImage,
inspects what is **inside** it, and takes name, description, categories and icon
from the embedded desktop file and AppStream metadata.

What our AppImage already contains (electron-builder):

- `usr/share/applications/lv24-wifi-explorer.desktop`
- `usr/share/icons/hicolor/*/apps/lv24-wifi-explorer.png`

What it does **not** contain yet:

- AppStream metainfo (`usr/share/metainfo/by.lv24.wifi.explorer.metainfo.xml`).
  Without it the catalogue can still pass, but there is no description, no
  long-form summary and no author-supplied screenshot. Adding
  `resources/metainfo/by.lv24.wifi.explorer.metainfo.xml` to the electron-builder
  `extraResources`/`files` output is the fix.

## Submission

1. Create `data/LV24_WiFi_Explorer` (no extension) in a fork of
   [`AppImage/appimage.github.io`](https://github.com/AppImage/appimage.github.io)
   containing exactly one line:

   ```
   https://github.com/LevapVeeskela/lv24-Wifi-Explorer
   ```

   The file name is the app name from the desktop file with spaces replaced by
   `_`; it must not contain a version, an architecture, `.AppImage` or `Linux`.
   Point at the repository, not at a specific release: the test picks the newest
   release automatically.

2. Open a PR that changes **only that one file**. The GitHub Action runs the
   AppImage, takes a screenshot and comments with the result.

3. If the test fails, comment `/retest` after a fix, or `/appstream` for
   screenshot/metainfo guidance.

## Requirements that decide pass/fail

- **x86_64 AppImage in the newest release.** The release workflow names it
  `LV24-WiFi-Explorer-1.0.0-linux-x86_64.AppImage`, which is the token the test
  looks for. Only one AppImage per release keeps the choice unambiguous.
- **glibc of the build host.** The test runs on the oldest Ubuntu LTS still in
  standard support (22.04 during 2026). An AppImage built on `ubuntu-latest`
  (24.04, glibc 2.39) fails with `error-glibc-too-new`. Either switch the Linux
  job to `runs-on: ubuntu-22.04` (still a free standard runner) or build inside
  an Ubuntu 22.04 container.
- **No network at startup.** The test runs the app offline; it must open its main
  window (demo fallback is fine) instead of exiting.
- **Executable bit and FUSE-free start.** electron-builder's AppImage target
  already produces a type-2 AppImage.

## Cost

$0. No account, no fee, no review SLA (maintainers merge manually).
