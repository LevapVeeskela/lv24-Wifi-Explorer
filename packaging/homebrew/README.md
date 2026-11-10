# Homebrew Cask

**Status: not eligible for `homebrew/cask` until the DMG is signed with a
Developer ID and notarized.** A cask in a personal tap works today, with the
Gatekeeper caveat below.

## Why

Homebrew's acceptance policy requires official macOS casks to pass its Gatekeeper
checks:

> "On macOS, apps, installers and other executable artefacts that Gatekeeper can
> assess must pass Homebrew's Gatekeeper checks and must not require System
> Integrity Protection or Gatekeeper to be disabled or bypassed."
> — <https://github.com/Homebrew/brew/blob/main/docs/Acceptable-Casks.md>

Homebrew also applies the quarantine attribute to cask downloads, so Gatekeeper
really does evaluate the app. An unsigned, unnotarized DMG fails that check; a
`brew audit --new --cask` run rejects it. Notarization needs a paid Apple
Developer Program membership ($99/year), which the zero-spend policy excludes —
so `homebrew/cask` is out of reach for now, by design.

## What is possible at $0

A self-hosted tap. Homebrew does not audit third-party taps, so the cask installs
and the user clears Gatekeeper manually once (System Settings → Privacy &
Security → "Open Anyway"). This is a worse experience and should be labelled as
unofficial.

```bash
# 1. Create <owner>/homebrew-tap (public repo, free)
#    Layout: Casks/lv24-wifi-explorer.rb
cp packaging/homebrew/lv24-wifi-explorer.rb <tap>/Casks/
git -C <tap> add Casks/lv24-wifi-explorer.rb
git -C <tap> commit -m "lv24-wifi-explorer 1.0.0"
git -C <tap> push

# 2. Users
brew tap <owner>/tap
brew install --cask lv24-wifi-explorer
```

## Checksums

The current release only ships `LV24-WiFi-Explorer-1.0.0-arm64-public.dmg`, and the
cask's `on_arm` hash is already filled from the published `checksums.txt`.
`dist:mac:public` builds both arches, so an x64 DMG must be uploaded before the
`on_intel` block can be filled:

```bash
shasum -a 256 "release/LV24-WiFi-Explorer-1.0.0-x64-public.dmg"
node scripts/packaging/fill-checksums.mjs "release/LV24-WiFi-Explorer-1.0.0-x64-public.dmg"
```

The cask is a **template**: `fill-checksums.mjs` only rewrites the Windows
manifests, so paste the x64 hash into `on_intel` by hand.

## If notarization ever happens

The same cask becomes eligible for `homebrew/cask` once
`spctl -a -vvv -t exec` reports `accepted, source=Notarized Developer ID`. At that
point: replace the placeholders, run `brew audit --new --cask
lv24-wifi-explorer`, `brew style`, then open a PR against
`Homebrew/homebrew-cask`. The `caveats` block about Gatekeeper must be removed.

Cost: $0 for the tap; $99/year for the Apple Developer Program, which is the
actual blocker.
