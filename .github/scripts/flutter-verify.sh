#!/usr/bin/env bash
# Analyze + test all Dart packages under packages/ and the flutter/ app.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

dart_packages=(
  packages/scan_domain
  packages/scan_core_client
  packages/scan_oui
)

flutter_packages=(
  packages/scan_l10n
  packages/lv24_sunset_theme
  flutter
)

for pkg in "${dart_packages[@]}"; do
  echo "::group::${pkg} (dart analyze + test)"
  (
    cd "$pkg"
    dart pub get
    dart analyze
    dart test
  )
  echo "::endgroup::"
done

for pkg in "${flutter_packages[@]}"; do
  echo "::group::${pkg} (flutter analyze + test)"
  (
    cd "$pkg"
    flutter pub get
    flutter analyze
    if [[ -d test ]]; then
      flutter test
    fi
  )
  echo "::endgroup::"
done
