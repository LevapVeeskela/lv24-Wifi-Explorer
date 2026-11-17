# Contributing

## Packages

| Path                          | Package              | Publishable                             |
| ----------------------------- | -------------------- | --------------------------------------- |
| `packages/core`               | `@lv24/wifi-core`    | yes (Apache-2.0)                        |
| `packages/backend`            | `@lv24/wifi-backend` | yes (Apache-2.0)                        |
| `packages/cli`                | `@lv24/wifi-cli`     | yes (Apache-2.0)                        |
| `packages/web`                | `@lv24/wifi-web`     | app (Apache-2.0 code)                   |
| `packages/desktop`            | `@lv24/wifi-desktop` | app (Apache-2.0 code, private manifest) |
| `flutter/`, `packages/scan_*` | Dart packages        | pub.dev-ready                           |
| `native/ScanCore`             | Swift helper         | macOS app helper                        |

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
and CLI packages are Apache-2.0 and do not depend on it. Building the full desktop UI
requires a valid MUI X license; the code itself is Apache-2.0. Local builds read
`VITE_MUI_LICENSE_KEY` from `.env.local`; release builds read it from the
`MUI_X_LICENSE_KEY` GitHub Actions secret. Never commit either file or value.
