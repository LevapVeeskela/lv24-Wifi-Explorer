// Maps public CoreWLAN types onto ScanResult + optional CoreWlanNetworkRecord.
// CWNetwork has no security / phyMode property — probe supportsSecurity: / supportsPHYMode:.
// Do not invent IE-deep fields (AKM/cipher, 80+80, 320 MHz) when the API does not expose them.
// transmitRate / activePHYMode / transmitPower belong only on AssociatedLink.

import CoreWLAN
import Foundation

enum CoreWlanMapping {
    /// CWSecurity raw values from public CoreWLANTypes.h
    private static let securityProbes: [(Int, SecurityKind, String)] = [
        (0, .open, "none"),
        (1, .wep, "wep"),
        (2, .wpaPersonal, "wpaPersonal"),
        (3, .wpaPersonalMixed, "wpaPersonalMixed"),
        (4, .wpa2Personal, "wpa2Personal"),
        (5, .personalGeneric, "personal"),
        (6, .dynamicWep, "dynamicWEP"),
        (7, .wpaEnterprise, "wpaEnterprise"),
        (8, .wpaEnterpriseMixed, "wpaEnterpriseMixed"),
        (9, .wpa2Enterprise, "wpa2Enterprise"),
        (10, .enterpriseGeneric, "enterprise"),
        (11, .wpa3Personal, "wpa3Personal"),
        (12, .wpa3Enterprise, "wpa3Enterprise"),
        (13, .wpa3Transition, "wpa3Transition"),
        (14, .owe, "owe"),
        (15, .oweTransition, "oweTransition"),
        (Int.max, .unknown, "unknown"),
    ]

    /// PHY_DISPLAY_ORDER: b, a, g, n, ac, ax, be (kCWPHYMode11* raw values).
    private static let phyProbes: [(Int, PhyLetter, WifiPhyMode)] = [
        (2, .b, .b),
        (1, .a, .a),
        (3, .g, .g),
        (4, .n, .n),
        (5, .ac, .ac),
        (6, .ax, .ax),
        (7, .be, .be),
    ]

    private static let phyRank: [WifiPhyMode] = [.be, .ax, .ac, .n, .a, .g, .b]

    static func scanResult(
        from network: CWNetwork,
        generation: Int,
        lastSeenAt: String,
        redactIdentity: Bool
    ) -> ScanResult {
        let channelObj = network.wlanChannel as CWChannel?
        let channelNumber = channelObj.map(\.channelNumber)
        let band = wifiBand(channelObj?.channelBand)
        let rawSsid = emptyToNil(network.ssid)
        let hidden = isHidden(ssid: network.ssid, ssidData: network.ssidData)
        let rawBssid = normalizeBSSID(network.bssid)
        let rssi = network.rssiValue
        let noiseRaw = network.noiseMeasurement
        let noise = ScanMath.isNoiseValid(noiseRaw) ? noiseRaw : nil
        let phys = probePhyModes(network)
        let (kinds, securityRaw) = probeSecurity(network)

        return ScanResult(
            id: ScanMath.rowId(
                bssid: rawBssid,
                ssid: rawSsid,
                channel: channelNumber,
                band: band,
                redactIdentity: redactIdentity
            ),
            ssid: redactIdentity ? nil : (hidden ? nil : rawSsid),
            bssid: redactIdentity ? nil : rawBssid,
            rssiDbm: rssi,
            noiseDbm: noise,
            snrDb: ScanMath.snrDb(rssiDbm: rssi, noiseDbm: noiseRaw),
            channel: channelNumber,
            channelWidth: wifiWidth(channelObj?.channelWidth),
            band: band,
            phyMode: highestPhy(phys),
            phyModesSupported: phys,
            security: securityLabel(kinds),
            securityRaw: securityRaw,
            oui: redactIdentity ? nil : ScanMath.oui(from: rawBssid),
            hidden: hidden,
            lastSeenAt: lastSeenAt,
            scanGeneration: generation
        )
    }

    static func record(from network: CWNetwork, redactIdentity: Bool) -> CoreWlanNetworkRecord {
        let channel = network.wlanChannel as CWChannel?
        let kinds = probeSecurity(network).0
        var record = CoreWlanNetworkRecord(
            ssid: network.ssid,
            ssidData: byteArray(network.ssidData),
            bssid: normalizeBSSID(network.bssid),
            rssiDbm: network.rssiValue,
            noiseDbm: network.noiseMeasurement,
            channelNumber: channel.map(\.channelNumber),
            channelBand: coreBand(channel?.channelBand),
            channelWidth: coreWidth(channel?.channelWidth),
            countryCode: network.countryCode,
            beaconIntervalMs: network.beaconInterval,
            ibss: network.ibss,
            informationElementData: byteArray(network.informationElementData),
            supportedSecurity: kinds,
            supportedPhyModes: probePhyLetters(network)
        )
        if redactIdentity {
            record.ssid = nil
            record.ssidData = nil
            record.bssid = nil
            record.countryCode = nil
        }
        return record
    }

    static func associatedLink(
        from iface: CWInterface,
        capturedAt: String,
        location: LocationAuthorization
    ) -> AssociatedLink? {
        guard iface.powerOn() else { return nil }
        guard iface.interfaceMode().rawValue != 0 else { return nil }

        let granted = location == .granted
        let ssid = iface.ssid()
        let bssid = normalizeBSSID(iface.bssid())
        let country = iface.countryCode()

        return AssociatedLink(
            interfaceName: iface.interfaceName ?? "unknown",
            capturedAt: capturedAt,
            ssid: granted ? .available(ssid) : .redacted,
            bssid: granted ? .available(bssid) : .redacted,
            rssiDbm: iface.rssiValue(),
            noiseDbm: iface.noiseMeasurement(),
            transmitRateMbps: iface.transmitRate(),
            activePhy: phyLetter(iface.activePHYMode()),
            security: securityKind(iface.security()),
            transmitPowerMw: iface.transmitPower(),
            hardwareAddress: normalizeBSSID(iface.hardwareAddress()),
            countryCode: granted ? .available(country) : .redacted
        )
    }

    static func dedupeKey(for raw: CWNetwork) -> String {
        if let bssid = normalizeBSSID(raw.bssid) {
            return "bssid:\(bssid)"
        }
        let hex = (byteArray(raw.ssidData) ?? []).map { String(format: "%02x", $0) }.joined()
        let channel = raw.wlanChannel as CWChannel?
        let ch = channel?.channelNumber ?? -1
        let bandRaw = channel?.channelBand.rawValue ?? 0
        return "ssid:\(hex)|ch:\(ch)|band:\(bandRaw)"
    }

    static func normalizeBSSID(_ raw: String?) -> String? {
        guard let raw else { return nil }
        let chunks = raw.split(separator: ":")
        if chunks.count == 6 {
            let parts = chunks.map { part -> String? in
                let hex = String(part).lowercased()
                guard hex.count >= 1, hex.count <= 2, hex.allSatisfy(\.isHexDigit) else { return nil }
                return hex.count == 1 ? "0\(hex)" : hex
            }
            if parts.allSatisfy({ $0 != nil }) {
                return parts.compactMap { $0 }.joined(separator: ":")
            }
        }
        let hex = raw.lowercased().filter(\.isHexDigit)
        guard hex.count == 12 else { return nil }
        return stride(from: 0, to: 12, by: 2).map { index in
            String(hex[hex.index(hex.startIndex, offsetBy: index)..<hex.index(hex.startIndex, offsetBy: index + 2)])
        }.joined(separator: ":")
    }

    static func isHidden(ssid: String?, ssidData: Data?) -> Bool {
        let name = ssid?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if name.isEmpty { return true }
        if let ssidData, ssidData.isEmpty { return true }
        return false
    }

    static func emptyToNil(_ value: String?) -> String? {
        guard let value else { return nil }
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    static func securityLabel(_ kinds: [SecurityKind]) -> WifiSecurityLabel {
        if kinds.contains(.wpa3Enterprise) { return .wpa3Enterprise }
        if kinds.contains(.wpa2Enterprise) || kinds.contains(.wpaEnterpriseMixed) { return .wpa2Enterprise }
        if kinds.contains(.wpaEnterprise) || kinds.contains(.enterpriseGeneric) { return .wpaEnterprise }
        if kinds.contains(.wpa3Personal) { return .wpa3Personal }
        if kinds.contains(.wpa3Transition) { return .wpa3Personal }
        if kinds.contains(.wpa2Personal) { return .wpa2Personal }
        if kinds.contains(.wpaPersonal) || kinds.contains(.wpaPersonalMixed) || kinds.contains(.personalGeneric) {
            return .wpaPersonal
        }
        if kinds.contains(.wep) || kinds.contains(.dynamicWep) { return .wep }
        if kinds.contains(.open) && kinds.count == 1 { return .open }
        if kinds.contains(.owe) || kinds.contains(.oweTransition) { return .mixedUnknown }
        if kinds.contains(.open) { return .open }
        if kinds.isEmpty { return .mixedUnknown }
        return .mixedUnknown
    }

    static func highestPhy(_ modes: [WifiPhyMode]) -> WifiPhyMode {
        for candidate in phyRank where modes.contains(candidate) {
            return candidate
        }
        return .unknown
    }

    static func securityKind(_ security: CWSecurity) -> SecurityKind {
        securityProbes.first(where: { $0.0 == security.rawValue })?.1 ?? .unknown
    }

    static func phyLetter(_ mode: CWPHYMode) -> PhyLetter? {
        phyProbes.first(where: { $0.0 == mode.rawValue })?.1
    }

    private static func probeSecurity(_ network: CWNetwork) -> ([SecurityKind], [String]) {
        var kinds: [SecurityKind] = []
        var raw: [String] = []
        for (value, kind, name) in securityProbes {
            guard let security = CWSecurity(rawValue: value) else { continue }
            if network.supportsSecurity(security) {
                kinds.append(kind)
                raw.append(name)
            }
        }
        return (kinds, raw)
    }

    private static func probePhyModes(_ network: CWNetwork) -> [WifiPhyMode] {
        phyProbes.compactMap { raw, _, mode in
            guard let phy = CWPHYMode(rawValue: raw) else { return nil }
            return network.supportsPHYMode(phy) ? mode : nil
        }
    }

    private static func probePhyLetters(_ network: CWNetwork) -> [PhyLetter] {
        phyProbes.compactMap { raw, letter, _ in
            guard let mode = CWPHYMode(rawValue: raw) else { return nil }
            return network.supportsPHYMode(mode) ? letter : nil
        }
    }

    private static func wifiBand(_ value: CWChannelBand?) -> WifiBand {
        switch value?.rawValue {
        case 1: return .twoPointFour
        case 2: return .five
        case 3: return .six
        default: return .unknown
        }
    }

    private static func wifiWidth(_ value: CWChannelWidth?) -> WifiChannelWidth {
        // CoreWLAN has no 80+80 / 320 MHz — do not invent them.
        switch value?.rawValue {
        case 1: return .mhz20
        case 2: return .mhz40
        case 3: return .mhz80
        case 4: return .mhz160
        default: return .unknown
        }
    }

    private static func coreBand(_ value: CWChannelBand?) -> CoreWlanChannelBand {
        switch value?.rawValue {
        case 1: return .twoGhz
        case 2: return .fiveGhz
        case 3: return .sixGhz
        default: return .unknown
        }
    }

    private static func coreWidth(_ value: CWChannelWidth?) -> CoreWlanChannelWidth {
        switch value?.rawValue {
        case 1: return .mhz20
        case 2: return .mhz40
        case 3: return .mhz80
        case 4: return .mhz160
        default: return .unknown
        }
    }

    private static func byteArray(_ data: Data?) -> [UInt8]? {
        guard let data else { return nil }
        return Array(data)
    }
}
