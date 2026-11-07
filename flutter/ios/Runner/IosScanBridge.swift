import CoreLocation
import Flutter
import NetworkExtension
import SystemConfiguration.CaptiveNetwork

/// Public-API iOS v1 scan bridge: connected / associated link only (no active scan).
final class IosScanBridge: NSObject, FlutterPlugin, CLLocationManagerDelegate {
  static let channelName = "dev.lv24.wifi_explorer/ios_scan"

  private var locationManager: CLLocationManager?
  private var pendingLocationResult: FlutterResult?

  static func register(with registrar: FlutterPluginRegistrar) {
    let channel = FlutterMethodChannel(
      name: channelName,
      binaryMessenger: registrar.messenger()
    )
    let instance = IosScanBridge()
    registrar.addMethodCallDelegate(instance, channel: channel)
  }

  func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
    switch call.method {
    case "getSnapshot":
      captureSnapshot(completion: result)
    case "requestLocationAuthorization":
      requestLocationAuthorization(result: result)
    default:
      result(FlutterMethodNotImplemented)
    }
  }

  // MARK: - Location

  private func requestLocationAuthorization(result: @escaping FlutterResult) {
    let manager = CLLocationManager()
    manager.delegate = self
    locationManager = manager
    pendingLocationResult = result
    manager.requestWhenInUseAuthorization()
    // If status is already decided, delegate may not fire; resolve shortly.
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { [weak self] in
      guard let self, let pending = self.pendingLocationResult else { return }
      self.pendingLocationResult = nil
      pending(self.locationWire(from: manager.authorizationStatus))
    }
  }

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    guard let pending = pendingLocationResult else { return }
    pendingLocationResult = nil
    pending(locationWire(from: manager.authorizationStatus))
  }

  private func locationWire(from status: CLAuthorizationStatus) -> String {
    switch status {
    case .authorizedAlways, .authorizedWhenInUse:
      return "granted"
    case .denied:
      return "denied"
    case .restricted:
      return "restricted"
    default:
      return "not-determined"
    }
  }

  private func locationAuthorized(_ status: CLAuthorizationStatus) -> Bool {
    status == .authorizedAlways || status == .authorizedWhenInUse
  }

  // MARK: - Snapshot

  private func captureSnapshot(completion: @escaping FlutterResult) {
    let started = CFAbsoluteTimeGetCurrent()
    let status = CLLocationManager.authorizationStatus()
    let location = locationWire(from: status)
    let authorized = locationAuthorized(status)

    if !authorized {
      let durationMs = Int((CFAbsoluteTimeGetCurrent() - started) * 1000)
      completion(demoSnapshotPayload(
        location: location,
        locationAuthorized: false,
        scanDurationMs: durationMs,
        error: [
          "code": "LOCATION_DENIED",
          "message": "Location permission is required to read Wi‑Fi network identity on iOS.",
          "recoverable": true,
          "demoFallback": true,
        ]
      ))
      return
    }

    NEHotspotNetwork.fetchCurrent { [weak self] hotspot in
      guard let self else {
        completion(FlutterError(code: "UNAVAILABLE", message: "Bridge deallocated", details: nil))
        return
      }

      let captive = self.captiveNetworkDetails()
      let ssid = self.nonEmpty(hotspot?.ssid) ?? captive.ssid
      let bssid = self.normalizeBssid(self.nonEmpty(hotspot?.bssid) ?? captive.bssid)
      let channel = captive.channel
      let durationMs = Int((CFAbsoluteTimeGetCurrent() - started) * 1000)

      if ssid == nil && bssid == nil {
        completion(self.demoSnapshotPayload(
          location: location,
          locationAuthorized: true,
          scanDurationMs: durationMs,
          error: [
            "code": "WIFI_OFF",
            "message": "No Wi‑Fi association detected (iOS does not expose active scanning to third-party apps).",
            "recoverable": true,
            "demoFallback": true,
          ]
        ))
        return
      }

      let band = self.channelBand(for: channel)
      let security = self.securityFlags(for: hotspot)
      var networks: [[String: Any]] = []
      if ssid != nil || bssid != nil {
        networks.append(self.flatNetworkRow(
          ssid: ssid,
          bssid: bssid,
          channel: channel,
          band: band,
          security: security
        ))
      }

      var payload: [String: Any] = [
        "capturedAt": Self.iso8601Now(),
        "interfaceName": "wlan0",
        "location": location,
        "locationAuthorized": true,
        "includeHiddenRequested": false,
        "source": "connectedNetworkOnly",
        "demo": false,
        "scanDurationMs": durationMs,
        "networks": networks,
        "associated": [
          "ssid": ssid as Any,
          "bssid": bssid as Any,
          "rssiDbm": NSNull(),
          "channelNumber": channel as Any,
          "channelBand": band as Any,
        ],
      ]

      if ssid == nil || bssid == nil {
        payload["error"] = [
          "code": "BSSID_UNAVAILABLE",
          "message": "SSID or BSSID redacted by the system; connected link fields may be incomplete.",
          "recoverable": true,
          "demoFallback": false,
        ]
      }

      completion(payload)
    }
  }

  private func demoSnapshotPayload(
    location: String,
    locationAuthorized: Bool,
    scanDurationMs: Int,
    error: [String: Any]
  ) -> [String: Any] {
    [
      "capturedAt": Self.iso8601Now(),
      "interfaceName": "wlan0",
      "location": location,
      "locationAuthorized": locationAuthorized,
      "includeHiddenRequested": false,
      "source": "demo",
      "demo": true,
      "scanDurationMs": scanDurationMs,
      "networks": [] as [[String: Any]],
      "associated": NSNull(),
      "error": error,
    ]
  }

  // MARK: - Captive Network (public, best-effort)

  private func captiveNetworkDetails() -> (ssid: String?, bssid: String?, channel: Int?) {
    guard let interfaces = CNCopySupportedInterfaces() as? [String] else {
      return (nil, nil, nil)
    }
    for interface in interfaces {
      guard let info = CNCopyCurrentNetworkInfo(interface as CFString) as? [String: Any] else {
        continue
      }
      let ssid = info[kCNNetworkInfoKeySSID as String] as? String
      let bssid = normalizeBssid(info[kCNNetworkInfoKeyBSSID as String] as? String)
      let channel = info[kCNNetworkInfoKeyChannel as String] as? Int
      return (nonEmpty(ssid), bssid, channel)
    }
    return (nil, nil, nil)
  }

  // MARK: - Mapping helpers

  private func flatNetworkRow(
    ssid: String?,
    bssid: String?,
    channel: Int?,
    band: String?,
    security: [String]
  ) -> [String: Any] {
    [
      "ssid": ssid as Any,
      "bssid": bssid as Any,
      "rssiDbm": 0,
      "noiseDbm": 0,
      "channelNumber": channel as Any,
      "channelBand": band ?? "unknown",
      "channelWidth": "unknown",
      "supportedSecurity": security,
      "supportedPhyModes": [] as [String],
      "ibss": false,
    ]
  }

  private func securityFlags(for hotspot: NEHotspotNetwork?) -> [String] {
    guard let hotspot else { return ["unknown"] }
    return securityFlags(hotspot.securityType)
  }

  private func securityFlags(_ type: NEHotspotNetworkSecurityType) -> [String] {
    switch type {
    case .open:
      return ["open"]
    case .WEP:
      return ["wep"]
    case .personal:
      return ["wpa2-personal"]
    case .enterprise:
      return ["wpa2-enterprise"]
    @unknown default:
      return ["unknown"]
    }
  }

  private func channelBand(for channel: Int?) -> String? {
    guard let channel else { return nil }
    if (1 ... 14).contains(channel) { return "2.4GHz" }
    if (36 ... 177).contains(channel) { return "5GHz" }
    if channel >= 1 { return "6GHz" }
    return "unknown"
  }

  private func normalizeBssid(_ raw: String?) -> String? {
    guard let raw = nonEmpty(raw) else { return nil }
    let lower = raw.lowercased()
    if lower.contains(":") { return lower }
    let hex = lower.filter { $0.isHexDigit }
    guard hex.count == 12 else { return lower }
    var parts: [String] = []
    var index = hex.startIndex
    for _ in 0 ..< 6 {
      let next = hex.index(index, offsetBy: 2)
      parts.append(String(hex[index ..< next]))
      index = next
    }
    return parts.joined(separator: ":")
  }

  private func nonEmpty(_ value: String?) -> String? {
    guard let value else { return nil }
    let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
    return trimmed.isEmpty ? nil : trimmed
  }

  private static func iso8601Now() -> String {
    ISO8601DateFormatter().string(from: Date())
  }
}
