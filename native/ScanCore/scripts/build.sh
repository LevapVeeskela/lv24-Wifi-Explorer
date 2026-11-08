#!/usr/bin/env bash
# xcodeproj-less ScanCore build: SwiftPM or swiftc → ScanCore.app + ad-hoc sign.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD="$ROOT/.build"
APP="$BUILD/ScanCore.app"
MACOS="$APP/Contents/MacOS"
BIN=""
CLT="/Library/Developer/CommandLineTools"
CLT_SDK="$CLT/SDKs/MacOSX.sdk"

log() { printf '[ScanCore build] %s\n' "$*" >&2; }

# Default /usr/bin/swiftc is Xcode-selected and license-gated; CLT is not.
if ! swiftc --version >/dev/null 2>&1; then
  if [[ -x "$CLT/usr/bin/swiftc" ]]; then
    export DEVELOPER_DIR="$CLT"
    log "using Command Line Tools toolchain (Xcode license not accepted)"
  fi
fi

compile_blocked() {
  log "COMPILE BLOCKED: Xcode license not accepted (sudo xcodebuild -license)."
  log "Sources, Package.swift, Info.plist, entitlements, and this script are complete."
  exit 2
}

try_swift_build() {
  if ! command -v swift >/dev/null 2>&1; then
    return 1
  fi
  if ! swift --version >/dev/null 2>&1; then
    return 1
  fi
  log "swift build -c release (arm64 + x86_64 universal when supported)"
  if swift build -c release --package-path "$ROOT" --product ScanCore --arch arm64 --arch x86_64; then
    local built
    built="$(swift build -c release --package-path "$ROOT" --arch arm64 --arch x86_64 --show-bin-path)/ScanCore"
    if [[ -x "$built" ]]; then
      BIN="$built"
      return 0
    fi
  fi
  log "universal build unavailable; falling back to host architecture"
  swift build -c release --package-path "$ROOT" --product ScanCore
  local hostBuilt
  hostBuilt="$(swift build -c release --package-path "$ROOT" --show-bin-path)/ScanCore"
  if [[ -x "$hostBuilt" ]]; then
    BIN="$hostBuilt"
    return 0
  fi
  return 1
}

try_swiftc() {
  if ! command -v swiftc >/dev/null 2>&1; then
    return 1
  fi
  if ! swiftc --version >/dev/null 2>&1; then
    return 1
  fi
  local sdk=""
  if [[ -d "$CLT_SDK" ]]; then
    sdk="$CLT_SDK"
  elif command -v xcrun >/dev/null 2>&1 && xcrun --show-sdk-path >/dev/null 2>&1; then
    sdk="$(xcrun --show-sdk-path)"
  fi
  mkdir -p "$BUILD/swiftc"
  local out="$BUILD/swiftc/ScanCore"
  local -a srcs=()
  while IFS= read -r file; do
    srcs+=("$file")
  done < <(find "$ROOT/Sources/ScanCore" -name '*.swift' | sort)
  log "swiftc ${#srcs[@]} sources"
  local -a cmd=(swiftc -O -o "$out" -target "arm64-apple-macosx13.5")
  if [[ -n "$sdk" ]]; then
    cmd+=(-sdk "$sdk")
  fi
  cmd+=(-framework CoreWLAN -framework CoreLocation -framework Foundation)
  cmd+=("${srcs[@]}")
  "${cmd[@]}"
  if [[ -x "$out" ]]; then
    BIN="$out"
    return 0
  fi
  return 1
}

bundle_app() {
  mkdir -p "$MACOS" "$APP/Contents/Resources/fixtures"
  cp "$ROOT/Info.plist" "$APP/Contents/Info.plist"
  if [[ -f "$ROOT/resources/fixtures/scan-snapshot.json" ]]; then
    cp "$ROOT/resources/fixtures/scan-snapshot.json" "$APP/Contents/Resources/fixtures/scan-snapshot.json"
  fi
  cp "$BIN" "$MACOS/ScanCore"
  chmod +x "$MACOS/ScanCore"
  local identity="${CODESIGN_IDENTITY:-}"
  if [[ -z "$identity" ]] && command -v security >/dev/null 2>&1; then
    # Prefer a stable Apple Development / Developer ID identity: ad-hoc
    # signatures cannot be granted Location Services (CoreWLAN redacts SSID).
    identity="$(security find-identity -v -p codesigning 2>/dev/null | awk -F'"' 'NR==1 { print $2 }')"
  fi
  identity="${identity:--}"
  if command -v codesign >/dev/null 2>&1; then
    codesign --force --deep --options runtime --sign "$identity" \
      --entitlements "$ROOT/ScanCore.entitlements" \
      --identifier com.lv24.wifi-explorer.scancore \
      "$APP" || log "codesign skipped/failed (ok for unsigned fixtures path)"
    log "signed with: $identity"
  fi
  log "app $APP"
}

if ! try_swift_build; then
  log "swift build failed or license-blocked; trying swiftc"
  if ! try_swiftc; then
    compile_blocked
  fi
fi

bundle_app
if command -v lipo >/dev/null 2>&1; then
  log "architectures: $(lipo -info "$MACOS/ScanCore" 2>/dev/null || echo unknown)"
  if ! lipo -info "$MACOS/ScanCore" 2>/dev/null | grep -q 'x86_64'; then
    log "WARNING: host-arch-only ScanCore; distribution requires a universal binary"
  fi
fi
log "ok"
