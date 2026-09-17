// swift-tools-version:5.9
//
// Clean-room ScanCore — public CoreWLAN + CoreLocation only.
// Do not add private frameworks, IO80211, or monitor-mode entitlements.

import PackageDescription

let package = Package(
    name: "ScanCore",
    platforms: [
        // SwiftPM has no 13.5 enum; Info.plist LSMinimumSystemVersion is 13.5.
        .macOS(.v13),
    ],
    products: [
        .executable(name: "ScanCore", targets: ["ScanCore"]),
    ],
    targets: [
        .executableTarget(
            name: "ScanCore",
            path: "Sources/ScanCore",
            linkerSettings: [
                .linkedFramework("CoreWLAN"),
                .linkedFramework("CoreLocation"),
                .linkedFramework("Foundation"),
            ]
        ),
    ]
)
