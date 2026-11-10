$ErrorActionPreference = 'Stop'

# Chocolatey downloads the release asset and verifies its SHA-256 before running
# it (CPMR0073). electron-builder's NSIS installer accepts /S for a silent,
# per-user install; it needs no elevation by itself, but Chocolatey always runs
# elevated, so the app lands in the profile of the account running choco.
$toolsDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$version = '1.0.0'

$packageArgs = @{
  packageName    = 'lv24-wifi-explorer'
  fileType       = 'exe'
  url64bit       = "https://github.com/LevapVeeskela/lv24-Wifi-Explorer/releases/download/v$version/LV24-WiFi-Explorer-$version-win-x64.exe"
  checksum64     = 'REPLACE_WITH_SHA256'
  checksumType64 = 'sha256'
  silentArgs     = '/S'
  validExitCodes = @(0)
  softwareName   = 'LV24 WiFi Explorer*'
}

Install-ChocolateyPackage @packageArgs
