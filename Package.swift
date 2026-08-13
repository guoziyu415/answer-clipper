// swift-tools-version: 5.10

import PackageDescription

let package = Package(
    name: "AnswerClipper",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(name: "AnswerClipper", targets: ["AnswerClipper"])
    ],
    targets: [
        .executableTarget(
            name: "AnswerClipper",
            path: "Sources/AnswerClipper"
        ),
        .testTarget(
            name: "AnswerClipperTests",
            dependencies: ["AnswerClipper"],
            path: "Tests/AnswerClipperTests"
        )
    ]
)
