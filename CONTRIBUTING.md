# Contributing

## Packages

| Path                          | Package              | Publishable                      |
| ----------------------------- | -------------------- | -------------------------------- |
| `packages/core`               | `@lv24/wifi-core`    | yes (MIT)                        |
| `packages/backend`            | `@lv24/wifi-backend` | yes (MIT)                        |
| `packages/cli`                | `@lv24/wifi-cli`     | yes (MIT)                        |
| `packages/web`                | `@lv24/wifi-web`     | app (MIT code)                   |
| `packages/desktop`            | `@lv24/wifi-desktop` | app (MIT code, private manifest) |
| `flutter/`, `packages/scan_*` | Dart packages        | pub.dev-ready                    |
| `native/ScanCore`             | Swift helper         | macOS app helper                 |

Keep dependencies pointing inward: `core` has no platform imports; `backend`
depends on `core`; `cli` depends on `backend`; `web`/`desktop` are hosts.
Never import Electron/Node/DOM into `core`.

## Checks

```bash
yarn build:packages
yarn typecheck
yarn lint
yarn check:boundaries
yarn test
yarn format:check
yarn cli scan --provider demo
cd flutter && flutter analyze --no-pub && flutter test --no-pub
```

## Commercial UI dependency

`web`/`desktop` use MUI X **Data Grid Pro** (commercial). The core, backend,
and CLI packages are MIT and do not depend on it. Building the full desktop UI
requires a valid MUI X license; the code itself is MIT.
