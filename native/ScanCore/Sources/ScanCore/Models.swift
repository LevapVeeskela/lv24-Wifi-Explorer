// Clean-room JSON types for ScanCore protocolVersion 1.
// Primary row type is ScanResult (docs/research/scancore-architecture.md).
// CoreWlanNetworkRecord is an optional compatibility array for the Electron mapper.

import Foundation

enum ScanCoreInfo {
    static let version = "1.0.0"
    static let protocolVersion = 1
    static let helperName = "lv24-wifi-scancore"
}

enum LocationAuthorization: String, Codable {
    case granted
    case denied
    case notDetermined = "not-determined"
    case restricted
}

enum WifiBand: String, Codable {
    case twoPointFour = "2.4GHz"
    case five = "5GHz"
    case six = "6GHz"
    case unknown
}

enum WifiChannelWidth: String, Codable {
    case mhz20 = "20MHz"
    case mhz40 = "40MHz"
    case mhz80 = "80MHz"
    case mhz80plus80 = "80+80MHz"
    case mhz160 = "160MHz"
    case unknown
}

enum WifiPhyMode: String, Codable {
    case a = "802.11a"
    case b = "802.11b"
    case g = "802.11g"
    case n = "802.11n"
    case ac = "802.11ac"
    case ax = "802.11ax"
    case be = "802.11be"
    case unknown
}

enum WifiSecurityLabel: String, Codable {
    case open = "Open"
    case wep = "WEP"
    case wpaPersonal = "WPA Personal"
    case wpa2Personal = "WPA2 Personal"
    case wpa3Personal = "WPA3 Personal"
    case wpaEnterprise = "WPA Enterprise"
    case wpa2Enterprise = "WPA2 Enterprise"
    case wpa3Enterprise = "WPA3 Enterprise"
    case mixedUnknown = "Mixed/Unknown"
}

enum SecurityKind: String, Codable {
    case open
    case wep
    case wpaPersonal = "wpa-personal"
    case wpaPersonalMixed = "wpa-personal-mixed"
    case wpa2Personal = "wpa2-personal"
    case wpa3Personal = "wpa3-personal"
    case wpa3Transition = "wpa3-transition"
    case personalGeneric = "personal-generic"
    case dynamicWep = "dynamic-wep"
    case wpaEnterprise = "wpa-enterprise"
    case wpaEnterpriseMixed = "wpa-enterprise-mixed"
    case wpa2Enterprise = "wpa2-enterprise"
    case wpa3Enterprise = "wpa3-enterprise"
    case enterpriseGeneric = "enterprise-generic"
    case owe
    case oweTransition = "owe-transition"
    case unknown
}

enum PhyLetter: String, Codable {
    case a, b, g, n, ac, ax, be
}

enum CoreWlanChannelBand: String, Codable {
    case unknown
    case twoGhz = "2ghz"
    case fiveGhz = "5ghz"
    case sixGhz = "6ghz"
}

enum CoreWlanChannelWidth: String, Codable {
    case unknown
    case mhz20 = "20mhz"
    case mhz40 = "40mhz"
    case mhz80 = "80mhz"
    case mhz160 = "160mhz"
}

/// Matches `src/domain/identity.ts` LocationGated<T>.
enum LocationGated<T: Encodable>: Encodable {
    case available(T)
    case redacted

    private enum CodingKeys: String, CodingKey {
        case status, value, reason
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .available(let value):
            try container.encode("available", forKey: .status)
            try container.encode(value, forKey: .value)
        case .redacted:
            try container.encode("redacted", forKey: .status)
            try container.encode("location-required", forKey: .reason)
        }
    }
}

/// Protocol v1 row: one CWNetwork after supportsSecurity: / supportsPHYMode: probes.
struct ScanResult: Codable, Equatable {
    var id: String
    var ssid: String?
    var bssid: String?
    var rssiDbm: Int?
    var noiseDbm: Int?
    var snrDb: Int?
    var channel: Int?
    var channelWidth: WifiChannelWidth
    var band: WifiBand
    var phyMode: WifiPhyMode
    var phyModesSupported: [WifiPhyMode]
    var security: WifiSecurityLabel
    var securityRaw: [String]
    var oui: String?
    var hidden: Bool
    var lastSeenAt: String
    var scanGeneration: Int

    enum CodingKeys: String, CodingKey {
        case id, ssid, bssid, rssiDbm, noiseDbm, snrDb, channel, channelWidth
        case band, phyMode, phyModesSupported, security, securityRaw, oui
        case hidden, lastSeenAt, scanGeneration
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(ssid, forKey: .ssid)
        try container.encode(bssid, forKey: .bssid)
        try container.encode(rssiDbm, forKey: .rssiDbm)
        try container.encode(noiseDbm, forKey: .noiseDbm)
        try container.encode(snrDb, forKey: .snrDb)
        try container.encode(channel, forKey: .channel)
        try container.encode(channelWidth, forKey: .channelWidth)
        try container.encode(band, forKey: .band)
        try container.encode(phyMode, forKey: .phyMode)
        try container.encode(phyModesSupported, forKey: .phyModesSupported)
        try container.encode(security, forKey: .security)
        try container.encode(securityRaw, forKey: .securityRaw)
        try container.encode(oui, forKey: .oui)
        try container.encode(hidden, forKey: .hidden)
        try container.encode(lastSeenAt, forKey: .lastSeenAt)
        try container.encode(scanGeneration, forKey: .scanGeneration)
    }
}

/// 1:1 `src/domain/bss.ts` CoreWlanNetworkRecord (optional `networks` array).
struct CoreWlanNetworkRecord: Encodable {
    var ssid: String?
    var ssidData: [UInt8]?
    var bssid: String?
    var rssiDbm: Int
    var noiseDbm: Int
    var channelNumber: Int?
    var channelBand: CoreWlanChannelBand
    var channelWidth: CoreWlanChannelWidth
    var countryCode: String?
    var beaconIntervalMs: Int
    var ibss: Bool
    var informationElementData: [UInt8]?
    var supportedSecurity: [SecurityKind]
    var supportedPhyModes: [PhyLetter]
}

/// 1:1 `src/domain/bss.ts` AssociatedLink.
struct AssociatedLink: Encodable {
    var interfaceName: String
    var capturedAt: String
    var ssid: LocationGated<String?>
    var bssid: LocationGated<String?>
    var rssiDbm: Int
    var noiseDbm: Int
    var transmitRateMbps: Double
    var activePhy: PhyLetter?
    var security: SecurityKind
    var transmitPowerMw: Int
    var hardwareAddress: String?
    var countryCode: LocationGated<String?>
}

struct ScanErrorPayload: Codable {
    var code: String
    var message: String
    var recoverable: Bool
    var demoFallback: Bool?

    init(code: String, message: String, recoverable: Bool, demoFallback: Bool? = nil) {
        self.code = code
        self.message = message
        self.recoverable = recoverable
        self.demoFallback = demoFallback
    }
}

/// protocolVersion 1 snapshot. `results` is the contract; extras are optional.
struct ScanCoreSnapshot: Encodable {
    var snapshotId: String
    var capturedAt: String
    var interfaceName: String
    var countryCode: String?
    var scanDurationMs: Int
    var stale: Bool
    var locationAuthorized: Bool
    var results: [ScanResult]
    var error: ScanErrorPayload?

    var location: LocationAuthorization
    var networks: [CoreWlanNetworkRecord]
    var associated: AssociatedLink?
    var includeHiddenRequested: Bool
    var source: String

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(snapshotId, forKey: .snapshotId)
        try container.encode(capturedAt, forKey: .capturedAt)
        try container.encode(interfaceName, forKey: .interfaceName)
        try container.encode(countryCode, forKey: .countryCode)
        try container.encode(scanDurationMs, forKey: .scanDurationMs)
        try container.encode(stale, forKey: .stale)
        try container.encode(locationAuthorized, forKey: .locationAuthorized)
        try container.encode(results, forKey: .results)
        try container.encode(error, forKey: .error)
        try container.encode(location, forKey: .location)
        try container.encode(networks, forKey: .networks)
        try container.encode(associated, forKey: .associated)
        try container.encode(includeHiddenRequested, forKey: .includeHiddenRequested)
        try container.encode(source, forKey: .source)
    }

    private enum CodingKeys: String, CodingKey {
        case snapshotId, capturedAt, interfaceName, countryCode, scanDurationMs
        case stale, locationAuthorized, results, error
        case location, networks, associated, includeHiddenRequested, source
    }
}

struct HelloPayload: Encodable {
    var type = "hello"
    var protocolVersion = ScanCoreInfo.protocolVersion
    var version = ScanCoreInfo.version
    var helper = ScanCoreInfo.helperName
    var transport: String
    var path: String?
    var port: UInt16?
    var tokenRequired: Bool
    var authToken: String?
}

struct TypedEnvelope<T: Encodable>: Encodable {
    var type: String
    var protocolVersion: Int = ScanCoreInfo.protocolVersion
    var payload: T
}

struct LocationAuthorizedPayload: Encodable {
    var authorized: Bool
    var location: LocationAuthorization
}

struct PermissionsPayload: Encodable {
    var location: LocationAuthorization
    var authorized: Bool
}

struct HelperStatusPayload: Encodable {
    var running: Bool
    var version: String = ScanCoreInfo.version
    var scanning: Bool
}

struct InboundMessage: Decodable {
    var type: String
    var token: String?
    var intervalMs: Int?
    var enabled: Bool?
    var options: StartOptions?
}

struct StartOptions: Decodable {
    var includeHidden: Bool?
}

enum SnapshotSource {
    static let activeScan = "scanForNetworks"
    static let cache = "cachedScanResults"
    static let associatedOnly = "associated-only"
    static let demo = "demo"
}

enum ScanErrorCode {
    static let locationDenied = "LOCATION_DENIED"
    static let locationRestricted = "LOCATION_RESTRICTED"
    static let wifiOff = "WIFI_OFF"
    static let noInterface = "NO_INTERFACE"
    static let scanFailed = "SCAN_FAILED"
    static let helperUnavailable = "HELPER_UNAVAILABLE"
    static let timeout = "TIMEOUT"
    static let bssidUnavailable = "BSSID_UNAVAILABLE"
}

enum ISOTime {
    static func now() -> String {
        formatter.string(from: Date())
    }

    static func string(from date: Date) -> String {
        formatter.string(from: date)
    }

    private static let formatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        return formatter
    }()
}

enum JSONLines {
    private static let lock = NSLock()
    private static let encoder: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.outputFormatting = []
        return encoder
    }()

    static func line<T: Encodable>(_ value: T) -> Data? {
        lock.lock()
        defer { lock.unlock() }
        do {
            var data = try encoder.encode(value)
            data.append(0x0A)
            return data
        } catch {
            return nil
        }
    }
}

enum ScanMath {
    static let noiseMinDbm = -120
    static let noiseMaxDbm = -20
    static let scanIntervalFloor: TimeInterval = 3.0

    static func isNoiseValid(_ noiseDbm: Int) -> Bool {
        if noiseDbm == 0 { return false }
        return noiseDbm >= noiseMinDbm && noiseDbm <= noiseMaxDbm
    }

    static func snrDb(rssiDbm: Int, noiseDbm: Int) -> Int? {
        guard isNoiseValid(noiseDbm) else { return nil }
        return rssiDbm - noiseDbm
    }

    static func scanInterval(lastDuration: TimeInterval, userFloor: TimeInterval = scanIntervalFloor) -> TimeInterval {
        max(userFloor, max(scanIntervalFloor, lastDuration * 1.1))
    }

    static func oui(from bssid: String?) -> String? {
        guard let bssid else { return nil }
        let parts = bssid.split(separator: ":")
        guard parts.count >= 3 else { return nil }
        return parts.prefix(3).map { $0.uppercased() }.joined(separator: ":")
    }

    static func stableHashId(ssid: String?, channel: Int?, band: WifiBand) -> String {
        let material = "\(ssid ?? "")|\(channel.map(String.init) ?? "")|\(band.rawValue)"
        var hash: UInt64 = 1_469_598_103_934_665_603_7
        for byte in material.utf8 {
            hash ^= UInt64(byte)
            hash = hash &* 1_099_511_628_211
        }
        return String(format: "h:%016llx", hash)
    }

    static func rowId(bssid: String?, ssid: String?, channel: Int?, band: WifiBand, redactIdentity: Bool) -> String {
        if !redactIdentity, let bssid, !bssid.isEmpty {
            return bssid
        }
        return stableHashId(ssid: ssid, channel: channel, band: band)
    }
}
