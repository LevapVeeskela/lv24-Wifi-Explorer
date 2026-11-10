# Flathub

**Status: not ready, and not submitted.** This directory holds a structural
reference only. Nothing here has been built with `flatpak-builder`.

> Flathub's requirements forbid AI-generated or AI-assisted manifests in
> submissions, and forbid AI agents opening the submission PR:
> <https://docs.flathub.org/docs/for-app-authors/requirements#generative-ai-policy>.
> Treat `by.lv24.wifi.explorer.yml` as a sketch. The manifest that is actually
> submitted must be authored and reviewed by a human.

## What Flathub requires (verified 2026-11-10)

- Build **entirely from source**, with **no network access during the build**.
  Every dependency must be a `sources` entry with a public URL:
  <https://docs.flathub.org/docs/for-app-authors/requirements#no-network-access-during-build>
  and <https://docs.flathub.org/docs/for-app-authors/requirements#building-from-source>.
- Runtime must be the current Flathub branch:
  <https://docs.flathub.org/docs/for-app-authors/runtimes>.
- AppStream metainfo that passes validation, plus a desktop file and an icon:
  <https://docs.flathub.org/docs/for-app-authors/metainfo-guidelines>.
- Minimal static permissions; portals where one exists:
  <https://docs.flathub.org/docs/for-app-authors/requirements#permissions>.
- Submission is a PR against the `new-pr` branch of `flathub/flathub`:
  <https://docs.flathub.org/docs/for-app-authors/submission>.

## What is missing (honest gap list)

1. **Offline dependency graph.** `yarn.lock` has ~250 KB of packages. The manifest
   needs `generated-sources.json` from
   [`flatpak-builder-tools`](https://github.com/flatpak/flatpak-builder-tools)
   (`flatpak-node-generator yarn yarn.lock -o generated-sources.json`). Not
   generated yet; it also pins the Electron zip, which must be a `file`/`archive`
   source with a `sha256`, not a download at build time.
2. **Linux scanner.** `packages/backend/src/providers/linux.ts` executes
   `nmcli`. Host binaries do not exist inside the sandbox. The provider must be
   rewritten against NetworkManager's D-Bus API (then
   `--system-talk-name=org.freedesktop.NetworkManager` is enough) or the app ships
   a non-functional scan. This is the same blocker as the Snap package.

   Flathub does allow native helpers — they just have to be **built from source
   by the manifest**. The macOS `ScanCore` Swift helper is irrelevant here (it is
   not shipped on Linux), so the blocker is the `nmcli` call, not a prebuilt
   binary.
3. **No AppStream metainfo in the repo.** Flathub requires the metainfo file to
   live in the upstream project (not in the submission PR). It must be added to
   the renderer/desktop build output as
   `by.lv24.wifi.explorer.metainfo.xml` and installed to
   `$FLATPAK_DEST/share/metainfo/`.
4. **Desktop file and icon naming.** The installed desktop file must be
   `by.lv24.wifi.explorer.desktop` with a matching icon name; electron-builder
   currently emits `lv24-wifi-explorer.desktop`. Either rename at install time
   (`rename-desktop-file` / `rename-icon`) or set `linux.desktop` and
   `executableName` accordingly.
5. **MUI X Pro licensing.** The renderer depends on `@mui/x-data-grid-pro`
   (commercial). Public builds must run with an **empty**
   `VITE_MUI_LICENSE_KEY`; `yarn check:public-bundle` enforces that. Whether the
   unlicensed/watermarked build may be redistributed publicly is a licensing
   question for the owner and for Flathub review — settle it before submitting.
6. **Human build + lint.** `flatpak run --command=flathub-build org.flatpak.Builder`
   must succeed locally and `flatpak-builder-lint` must pass before the PR.
   Neither has been run.
7. **Development history / verification.** The Flathub ID `by.lv24.wifi.explorer`
   implies control of `lv24.by`; the domain-controlled verification flow may be
   requested. Reviewer discretion applies to young projects.

## If/when it is ready

```bash
flatpak install -y flathub org.flatpak.Builder
flatpak remote-add --if-not-exists --user flathub https://dl.flathub.org/repo/flathub.flatpakrepo
flatpak run --command=flathub-build org.flatpak.Builder --install by.lv24.wifi.explorer.yml
flatpak run by.lv24.wifi.explorer
flatpak run --command=flatpak-builder-lint org.flatpak.Builder manifest by.lv24.wifi.explorer.yml
```

Then open a PR against `flathub/flathub:new-pr` (base branch `new-pr`, not
`master`) titled `Add by.lv24.wifi.explorer`. Review is volunteer-run; there is
no cost at any point.
