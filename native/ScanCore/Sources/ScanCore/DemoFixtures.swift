// Demo snapshots. Original LV24 fixtures only — never load WiFi Explorer demo.bin.

import Foundation

enum DemoFixtures {
    static func snapshot(generation: Int, capturedAt: String = ISOTime.now()) -> ScanCoreSnapshot {
        if let url = findFixtureURL(), let data = try? Data(contentsOf: url) {
            if let parsed = parse(data, generation: generation, capturedAt: capturedAt) {
                log("demo fixture \(url.path)")
                return parsed
            }
            log("demo fixture unreadable at \(url.path); using hardcoded snapshot")
        }
        return hardcoded(generation: generation, capturedAt: capturedAt)
    }

    static func findFixtureURL() -> URL? {
        var candidates: [URL] = []
        if let env = ProcessInfo.processInfo.environment["SCANCORE_FIXTURE"], !env.isEmpty {
            candidates.append(URL(fileURLWithPath: env))
        }

        let relative = [
            "resources/fixtures/scan-snapshot.json",
            "Contents/Resources/fixtures/scan-snapshot.json",
            "Contents/Resources/scan-snapshot.json",
        ]

        let fileManager = FileManager.default
        let cwd = URL(fileURLWithPath: fileManager.currentDirectoryPath)
        candidates.append(contentsOf: relative.map { cwd.appendingPathComponent($0) })

        var roots: [URL] = [
            Bundle.main.bundleURL,
            Bundle.main.resourceURL,
            URL(fileURLWithPath: CommandLine.arguments[0]).standardized.deletingLastPathComponent(),
        ].compactMap { $0 }

        var cursor = URL(fileURLWithPath: CommandLine.arguments[0]).standardized.deletingLastPathComponent()
        for _ in 0..<6 {
            roots.append(cursor)
            cursor.deleteLastPathComponent()
        }

        for root in roots {
            candidates.append(root.appendingPathComponent("resources/fixtures/scan-snapshot.json"))
            candidates.append(root.appendingPathComponent("fixtures/scan-snapshot.json"))
            candidates.append(root.appendingPathComponent("scan-snapshot.json"))
            if root.pathExtension == "app" {
                candidates.append(root.appendingPathComponent("Contents/Resources/fixtures/scan-snapshot.json"))
                candidates.append(root.appendingPathComponent("Contents/Resources/scan-snapshot.json"))
            }
        }

        var seen = Set<String>()
        for url in candidates {
            let path = url.standardizedFileURL.path
            if seen.contains(path) { continue }
            seen.insert(path)
            if fileManager.isReadableFile(atPath: path) {
                return url.standardizedFileURL
            }
        }
        return nil
    }

    private static func parse(_ data: Data, generation: Int, capturedAt: String) -> ScanCoreSnapshot? {
        guard let object = try? JSONSerialization.jsonObject(with: data) else { return nil }

        if let array = object as? [Any] {
            return wrap(resultsJSON: array, generation: generation, capturedAt: capturedAt)
        }

        guard var dict = object as? [String: Any] else { return nil }
        if dict["type"] as? String == "scan:snapshot", let payload = dict["payload"] as? [String: Any] {
            dict = payload
        }

        let resultsJSON: [Any]
        if let results = dict["results"] as? [Any] {
            resultsJSON = results
        } else if let networks = dict["networks"] as? [Any] {
            resultsJSON = networks
        } else {
            return nil
        }

        return wrap(
            resultsJSON: resultsJSON,
            generation: generation,
            capturedAt: capturedAt,
            interfaceName: dict["interfaceName"] as? String,
            countryCode: dict["countryCode"] as? String,
            locationAuthorized: dict["locationAuthorized"] as? Bool
        )
    }

    private static func wrap(
        resultsJSON: [Any],
        generation: Int,
        capturedAt: String,
        interfaceName: String? = nil,
        countryCode: String? = nil,
        locationAuthorized: Bool? = nil
    ) -> ScanCoreSnapshot? {
        let decoder = JSONDecoder()
        var results: [ScanResult] = []
        for item in resultsJSON {
            guard JSONSerialization.isValidJSONObject(item),
                  let data = try? JSONSerialization.data(withJSONObject: item),
                  var row = try? decoder.decode(ScanResult.self, from: data)
            else {
                continue
            }
            row.lastSeenAt = capturedAt
            row.scanGeneration = generation
            results.append(row)
        }
        guard !results.isEmpty else { return nil }
        return envelope(
            results: results,
            generation: generation,
            capturedAt: capturedAt,
            interfaceName: interfaceName ?? "en0",
            countryCode: countryCode,
            locationAuthorized: locationAuthorized ?? true
        )
    }

    static func hardcoded(generation: Int, capturedAt: String) -> ScanCoreSnapshot {
        envelope(
            results: hardcodedResults(generation: generation, capturedAt: capturedAt),
            generation: generation,
            capturedAt: capturedAt,
            interfaceName: "en0",
            countryCode: nil,
            locationAuthorized: true
        )
    }

    static func hardcodedResults(generation: Int, capturedAt: String) -> [ScanResult] {
        [
            ScanResult(
                id: "02:11:24:00:00:01",
                ssid: "LV24-Lab-2G",
                bssid: "02:11:24:00:00:01",
                rssiDbm: -48,
                noiseDbm: -92,
                snrDb: 44,
                channel: 6,
                channelWidth: .mhz20,
                band: .twoPointFour,
                phyMode: .n,
                phyModesSupported: [.b, .g, .n],
                security: .wpa2Personal,
                securityRaw: ["wpa2Personal"],
                oui: "02:11:24",
                hidden: false,
                lastSeenAt: capturedAt,
                scanGeneration: generation
            ),
            ScanResult(
                id: "02:11:24:00:00:02",
                ssid: "LV24-Lab-5G",
                bssid: "02:11:24:00:00:02",
                rssiDbm: -61,
                noiseDbm: -95,
                snrDb: 34,
                channel: 36,
                channelWidth: .mhz80,
                band: .five,
                phyMode: .ax,
                phyModesSupported: [.a, .n, .ac, .ax],
                security: .wpa3Personal,
                securityRaw: ["wpa2Personal", "wpa3Personal", "wpa3Transition"],
                oui: "02:11:24",
                hidden: false,
                lastSeenAt: capturedAt,
                scanGeneration: generation
            ),
            ScanResult(
                id: ScanMath.stableHashId(ssid: nil, channel: 11, band: .twoPointFour),
                ssid: nil,
                bssid: "02:11:24:00:00:03",
                rssiDbm: -73,
                noiseDbm: nil,
                snrDb: nil,
                channel: 11,
                channelWidth: .mhz20,
                band: .twoPointFour,
                phyMode: .g,
                phyModesSupported: [.b, .g],
                security: .open,
                securityRaw: ["none"],
                oui: "02:11:24",
                hidden: true,
                lastSeenAt: capturedAt,
                scanGeneration: generation
            ),
        ]
    }

    static func envelope(
        results: [ScanResult],
        generation: Int,
        capturedAt: String,
        interfaceName: String,
        countryCode: String?,
        locationAuthorized: Bool
    ) -> ScanCoreSnapshot {
        _ = generation
        return ScanCoreSnapshot(
            snapshotId: UUID().uuidString.lowercased(),
            capturedAt: capturedAt,
            interfaceName: interfaceName,
            countryCode: countryCode,
            scanDurationMs: 12,
            stale: false,
            locationAuthorized: locationAuthorized,
            results: results,
            error: nil,
            location: locationAuthorized ? .granted : .notDetermined,
            networks: results.map(compatibilityRecord(from:)),
            associated: nil,
            includeHiddenRequested: true,
            source: SnapshotSource.demo
        )
    }

    static func compatibilityRecord(from result: ScanResult) -> CoreWlanNetworkRecord {
        CoreWlanNetworkRecord(
            ssid: result.ssid,
            ssidData: result.ssid.map { Array($0.utf8) },
            bssid: result.bssid,
            rssiDbm: result.rssiDbm ?? 0,
            noiseDbm: result.noiseDbm ?? 0,
            channelNumber: result.channel,
            channelBand: coreBand(result.band),
            channelWidth: coreWidth(result.channelWidth),
            countryCode: nil,
            beaconIntervalMs: 100,
            ibss: false,
            informationElementData: nil,
            supportedSecurity: kinds(from: result.securityRaw, label: result.security),
            supportedPhyModes: result.phyModesSupported.compactMap(phyLetter(from:))
        )
    }

    private static func coreBand(_ band: WifiBand) -> CoreWlanChannelBand {
        switch band {
        case .twoPointFour: return .twoGhz
        case .five: return .fiveGhz
        case .six: return .sixGhz
        case .unknown: return .unknown
        }
    }

    private static func coreWidth(_ width: WifiChannelWidth) -> CoreWlanChannelWidth {
        switch width {
        case .mhz20: return .mhz20
        case .mhz40: return .mhz40
        case .mhz80, .mhz80plus80: return .mhz80
        case .mhz160: return .mhz160
        case .unknown: return .unknown
        }
    }

    private static func phyLetter(from mode: WifiPhyMode) -> PhyLetter? {
        switch mode {
        case .a: return .a
        case .b: return .b
        case .g: return .g
        case .n: return .n
        case .ac: return .ac
        case .ax: return .ax
        case .be: return .be
        case .unknown: return nil
        }
    }

    private static func kinds(from raw: [String], label: WifiSecurityLabel) -> [SecurityKind] {
        let mapped = raw.compactMap { name -> SecurityKind? in
            switch name.lowercased() {
            case "none", "open": return .open
            case "wep": return .wep
            case "wpapersonal", "wpa-personal": return .wpaPersonal
            case "wpapersonalmixed", "wpa-personal-mixed": return .wpaPersonalMixed
            case "wpa2personal", "wpa2-personal": return .wpa2Personal
            case "wpa3personal", "wpa3-personal": return .wpa3Personal
            case "wpa3transition", "wpa3-transition": return .wpa3Transition
            case "wpaenterprise", "wpa-enterprise": return .wpaEnterprise
            case "wpaenterprisemixed", "wpa-enterprise-mixed": return .wpaEnterpriseMixed
            case "wpa2enterprise", "wpa2-enterprise": return .wpa2Enterprise
            case "wpa3enterprise", "wpa3-enterprise": return .wpa3Enterprise
            case "owe": return .owe
            case "owetransition", "owe-transition": return .oweTransition
            default: return nil
            }
        }
        if !mapped.isEmpty { return mapped }
        switch label {
        case .open: return [.open]
        case .wep: return [.wep]
        case .wpaPersonal: return [.wpaPersonal]
        case .wpa2Personal: return [.wpa2Personal]
        case .wpa3Personal: return [.wpa3Personal]
        case .wpaEnterprise: return [.wpaEnterprise]
        case .wpa2Enterprise: return [.wpa2Enterprise]
        case .wpa3Enterprise: return [.wpa3Enterprise]
        case .mixedUnknown: return [.unknown]
        }
    }
}
