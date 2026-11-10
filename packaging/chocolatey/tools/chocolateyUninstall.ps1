$ErrorActionPreference = 'Stop'

# AutoUninstaller normally removes NSIS apps by reading the ARP uninstall string,
# so this script is a deterministic fallback: resolve the same registry entry and
# run the uninstaller with /S. It avoids hardcoding the per-user install path.
[array]$keys = Get-UninstallRegistryKey -SoftwareName 'LV24 WiFi Explorer*'

if ($keys.Count -eq 0) {
  Write-Warning 'LV24 WiFi Explorer is not installed; nothing to remove.'
  return
}

foreach ($key in $keys) {
  $uninstallString = [string]$key.UninstallString
  if ([string]::IsNullOrWhiteSpace($uninstallString)) { continue }

  $file = $uninstallString.Trim()
  if ($file.StartsWith('"')) {
    $end = $file.IndexOf('"', 1)
    if ($end -gt 1) { $file = $file.Substring(1, $end - 1) }
  } else {
    $file = ($file -split '\s+')[0]
  }

  Uninstall-ChocolateyPackage `
    -PackageName 'lv24-wifi-explorer' `
    -FileType 'exe' `
    -SilentArgs '/S' `
    -File $file `
    -ValidExitCodes @(0)
}
