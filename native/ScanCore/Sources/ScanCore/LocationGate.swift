// CoreLocation When In Use gate for SSID / BSSID / countryCode.
// Apple classifies those Wi-Fi identity fields as location-class data.
// We do not use GPS: coordinates are not stored or emitted on the protocol.

import CoreLocation
import Foundation

final class LocationGate: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    private let lock = NSLock()
    private var lastStatus: LocationAuthorization = .notDetermined
    var onChange: ((LocationAuthorization) -> Void)?

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyKilometer
        manager.pausesLocationUpdatesAutomatically = true
        lastStatus = readStatus()
    }

    var status: LocationAuthorization {
        lock.lock()
        defer { lock.unlock() }
        return lastStatus
    }

    var shouldRedactIdentity: Bool {
        status != .granted
    }

    func requestWhenInUse() {
        let current = readStatus()
        publish(current)
        if current == .notDetermined {
            if #available(macOS 14.0, *) {
                manager.requestWhenInUseAuthorization()
            } else {
                manager.requestAlwaysAuthorization()
            }
        }
        // Brief When In Use updates unlock Wi-Fi identity on several macOS releases.
        // Coordinates are discarded immediately — ScanCore never emits GPS.
        manager.startUpdatingLocation()
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) { [weak self] in
            self?.manager.stopUpdatingLocation()
        }
    }

    func refresh() -> LocationAuthorization {
        let current = readStatus()
        publish(current)
        return current
    }

    static func openSystemSettings() {
        let candidates = [
            "x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_LocationServices",
            "x-apple.systempreferences:com.apple.preference.security?Privacy_LocationServices",
        ]
        guard let url = candidates.compactMap({ URL(string: $0) }).first else { return }
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/open")
        process.arguments = [url.absoluteString]
        try? process.run()
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        publish(readStatus())
    }

    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        publish(map(status))
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        manager.stopUpdatingLocation()
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        log("location update failed (identity still scanned if CoreWLAN allows)")
        _ = error
    }

    private func readStatus() -> LocationAuthorization {
        map(manager.authorizationStatus)
    }

    private func map(_ status: CLAuthorizationStatus) -> LocationAuthorization {
        // Raw values stay stable across macOS SDK renames of .authorized.
        switch status.rawValue {
        case 3, 4:
            return .granted
        case 2:
            return .denied
        case 1:
            return .restricted
        default:
            return .notDetermined
        }
    }

    private func publish(_ status: LocationAuthorization) {
        lock.lock()
        let changed = lastStatus != status
        lastStatus = status
        lock.unlock()
        if changed {
            onChange?(status)
        }
    }
}

func log(_ message: String) {
    let line = "[ScanCore] \(message)\n"
    if let data = line.data(using: .utf8) {
        FileHandle.standardError.write(data)
    }
}
