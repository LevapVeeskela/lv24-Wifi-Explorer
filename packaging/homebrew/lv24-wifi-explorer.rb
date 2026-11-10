# Self-hosted tap only — NOT eligible for homebrew/cask while the DMG is
# unsigned and unnotarized. See README.md.
#
# Install with:
#   brew tap <owner>/tap
#   brew install --cask lv24-wifi-explorer
cask "lv24-wifi-explorer" do
  version "1.0.0"

  on_arm do
    # Taken from the v1.0.0 release checksums.txt.
    sha256 "b445127c913f52a665eddbe535c23ddf842003b854f857e57bf4fb42da9697ca"
    url "https://github.com/LevapVeeskela/lv24-Wifi-Explorer/releases/download/v#{version}/LV24-WiFi-Explorer-#{version}-arm64-public.dmg"
  end

  on_intel do
    sha256 "REPLACE_WITH_SHA256_X64"
    url "https://github.com/LevapVeeskela/lv24-Wifi-Explorer/releases/download/v#{version}/LV24-WiFi-Explorer-#{version}-x64-public.dmg"
  end

  name "LV24 WiFi Explorer"
  desc "Wi-Fi scanner with channel, signal and security analysis"
  homepage "https://github.com/LevapVeeskela/lv24-Wifi-Explorer"

  livecheck do
    url :url
    strategy :github_latest
  end

  depends_on macos: ">= :ventura"

  app "LV24 WiFi Explorer.app"

  caveats <<~EOS
    This build is unsigned and not notarized. macOS blocks the first launch.
    Open System Settings -> Privacy & Security and choose "Open Anyway",
    or run: xattr -dr com.apple.quarantine "/Applications/LV24 WiFi Explorer.app"
    The app must be granted Location access for ScanCore to return live results.
  EOS
end
