# Snap Store

**Status: not published. Blocked by the Linux scan backend, not by packaging.**

## Why a snap is not ready

`packages/backend/src/providers/linux.ts` shells out to `nmcli`:

```ts
execFile(command, ['-t', '-f', 'BSSID,SSID,CHAN,FREQ,SIGNAL,SECURITY', 'dev', 'wifi', 'list', '--rescan', 'yes'], ...)
```

A strictly confined snap cannot execute host binaries (`/usr/bin/nmcli` is not in
the snap), so `nmcli` fails and the app falls back to the demo provider. Two ways
out, both real work:

1. **Rewrite the Linux provider on the NetworkManager D-Bus API**
   (`org.freedesktop.NetworkManager`), request `--system-talk-name=org.freedesktop.NetworkManager`
   in `finish-args`, and keep `confinement: strict`. This is the only route that
   can be published without store review of the confinement.
2. **Ship `confinement: classic`.** Classic snaps run unconfined, so `nmcli`
   works, but the Snap Store requires manual approval for classic confinement and
   only grants it when confinement is genuinely impossible. Wi-Fi scanning via
   D-Bus is possible, so an approval for classic is unlikely.

Until one of those is done, a published snap would be a broken app. Do not upload
one.

## How it would be built (electron-builder)

electron-builder 25 has a `snap` target. It is not enabled in
`electron-builder.yml`, because a target that produces a non-functional app is
worse than no target. When the provider is fixed, add:

```yaml
linux:
  target:
    - target: AppImage
      arch: [x64, arm64]
    - target: snap
      arch: [x64]
snap:
  confinement: strict        # default; `classic` needs store approval
  grade: stable
  plugs:
    - default
    - network-manager        # only meaningful once the provider talks D-Bus
```

```bash
yarn dist:linux --x64        # or: npx electron-builder --linux snap --x64
sudo snap install --dangerous release/*.snap   # local smoke test
```

## Publishing (manual, free)

1. Create a free Ubuntu One / Snapcraft account: <https://snapcraft.io/account>.
2. Register the name `lv24-wifi-explorer` (free; names are global and permanent).
3. `snapcraft login`, then `snapcraft upload --release=stable <file>.snap`.
4. The store runs automated review; `strict` snaps with the `network-manager`
   plug normally pass without human review.

Cost: $0. There is no paid tier required to publish.

## References

- Confinement: <https://snapcraft.io/docs/snap-confinement>
- Interfaces: <https://snapcraft.io/docs/supported-interfaces>
- Publishing: <https://snapcraft.io/docs/releasing-your-app>
