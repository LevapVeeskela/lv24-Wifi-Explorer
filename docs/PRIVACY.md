# Privacy policy — LV24 WiFi Explorer

**Effective date:** 2026-11-10  
**Applies to:** LV24 WiFi Explorer desktop app, `lv24-wifi` CLI, `lv24-wifi-mcp`
server and the `lv24-wifi-explorer` Python launcher.

**Controller:** Pavel Aliakseyeu, contact **support@lv24.by**.

## Summary

LV24 WiFi Explorer is a local Wi-Fi scanner. It does **not** create accounts, show
ads, use analytics, or send scan results to us or to third parties. Scan data stays
on the device unless you explicitly save or export it.

## What the app processes

- **Wi-Fi scan results:** SSID, BSSID, signal strength, channel, width, security
  and information elements exposed by the operating system. These are processed
  in memory to render the UI, CLI output, snapshots and diagnostics.
- **Location permission (macOS):** Apple requires Location authorization before
  CoreWLAN returns SSID/BSSID. The permission is used by the signed `ScanCore`
  helper only to read Wi-Fi metadata; the app does not collect or transmit the
  device location.
- **Local settings and files:** window layout, filters, annotations, coloring
  rules, saved profiles, `.lv24scan` snapshots, CSV/print exports. They are stored
  in the app's local data directory or in the location you choose.

On Windows the scanner uses `netsh wlan show networks`; on Linux it uses
NetworkManager (`nmcli`). Both are local operating-system tools.

## What the app does not do

- No telemetry, crash reporting, analytics or advertising SDKs.
- No user accounts, cloud sync or remote scan service.
- No sale or sharing of scan results, BSSIDs, SSIDs or saved files.
- No background network requests. The desktop app only contacts the network when
  you open a link or download an update yourself.

## Network access

- **GitHub Releases** hosts installers and release notes. Downloading them is a
  normal HTTPS request handled by your browser; GitHub may log your IP address
  under the [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement).
- **npm and PyPI** are used only when you install the CLI/MCP packages or the
  Python launcher. Those registries have their own privacy policies.
- **Microsoft Store** (if you install from it) may collect Store telemetry under
  the [Microsoft Privacy Statement](https://privacy.microsoft.com/privacystatement).
  The app itself does not add telemetry.

## Storage and retention

Snapshots, exports, settings and annotations remain on your device until you
delete them. Uninstalling the app removes the program; app data under the user
profile may remain and can be deleted manually. We do not hold a copy.

## Security

Scan data is processed locally. No secrets, credentials or scan results are sent
to us. Report a security issue through the repository's issue tracker or by email.

## Children

The app is a network utility and is not directed at children. It does not collect
personal information from anyone.

## Your choices

- Deny Location on macOS: the app shows RF-only data or demo fixtures instead of
  SSID/BSSID.
- Delete saved snapshots, exports and app data at any time.
- Use the app entirely offline with the `demo` provider or local snapshots.

## Changes

We will update this page when the app's data practices change and note material
changes in the release notes.

## Contact

**support@lv24.by** · https://github.com/LevapVeeskela/lv24-Wifi-Explorer/issues
