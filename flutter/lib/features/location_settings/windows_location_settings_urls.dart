/// Best-effort Windows Settings URIs for the denied sheet.
///
/// Tried in order; unknown schemes fail soft. Wi‑Fi pane first, then Location.
const List<String> windowsLocationSettingsUrls = [
  'ms-settings:network-wifi',
  'ms-settings:privacy-location',
];

typedef WindowsSettingsUrlRunner = Future<bool> Function(String url);

/// Runs [windowsLocationSettingsUrls] until one launch succeeds.
Future<bool> tryWindowsLocationSettingsUrls(
  WindowsSettingsUrlRunner run,
) async {
  for (final url in windowsLocationSettingsUrls) {
    try {
      if (await run(url)) {
        return true;
      }
    } catch (_) {
      // Unknown scheme or failed launch — try the next URI.
    }
  }
  return false;
}
