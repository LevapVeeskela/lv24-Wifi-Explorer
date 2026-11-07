import Cocoa
import FlutterMacOS

// Keep in sync with electron/window.ts (MAIN_WINDOW_TITLE + createMainWindowConfig).
private enum MainWindowMetrics {
  static let title = "LV24 WiFi Explorer"
  static let defaultContentSize = NSSize(width: 1280, height: 860)
  static let minimumContentSize = NSSize(width: 960, height: 640)
}

class MainFlutterWindow: NSWindow {
  override func awakeFromNib() {
    let flutterViewController = FlutterViewController()
    self.contentViewController = flutterViewController
    self.title = MainWindowMetrics.title
    self.contentMinSize = MainWindowMetrics.minimumContentSize
    self.setContentSize(MainWindowMetrics.defaultContentSize)
    self.center()

    RegisterGeneratedPlugins(registry: flutterViewController)

    super.awakeFromNib()
  }
}
