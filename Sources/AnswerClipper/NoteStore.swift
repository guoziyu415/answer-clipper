import Foundation

enum ClipKind: String, CaseIterable, Identifiable {
    case thought = "想法"
    case question = "问题"
    case verify = "待验证"
    case highlight = "重点"

    var id: String { rawValue }
}

struct Clip {
    let quote: String
    let annotation: String
    let kind: ClipKind
    let tags: [String]
    let sourceApplication: String?
    let createdAt: Date
}

final class NoteStore {
    private enum Keys {
        static let notePath = "notePath"
    }

    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    var noteURL: URL {
        if let storedPath = defaults.string(forKey: Keys.notePath), !storedPath.isEmpty {
            return URL(fileURLWithPath: storedPath)
        }
        return FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Documents", isDirectory: true)
            .appendingPathComponent("AnswerClipper", isDirectory: true)
            .appendingPathComponent("Inbox.md", isDirectory: false)
    }

    func setNoteURL(_ url: URL) {
        defaults.set(url.path, forKey: Keys.notePath)
    }

    func ensureFileExists() throws {
        let directory = noteURL.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        if !FileManager.default.fileExists(atPath: noteURL.path) {
            try "# Answer Clipper\n\n".write(to: noteURL, atomically: true, encoding: .utf8)
        }
    }

    func append(_ clip: Clip) throws {
        try ensureFileExists()
        guard let data = MarkdownFormatter.entry(for: clip).data(using: .utf8) else {
            throw CocoaError(.fileWriteInapplicableStringEncoding)
        }
        let handle = try FileHandle(forWritingTo: noteURL)
        defer { try? handle.close() }
        try handle.seekToEnd()
        try handle.write(contentsOf: data)
    }
}

enum MarkdownFormatter {
    static func entry(for clip: Clip) -> String {
        let timestamp = timestampFormatter.string(from: clip.createdAt)
        let title = clip.annotation
            .components(separatedBy: .newlines)
            .first(where: { !$0.trimmingCharacters(in: .whitespaces).isEmpty })
            .map { String($0.prefix(42)) }
            ?? clip.kind.rawValue

        let quote = clip.quote
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .components(separatedBy: .newlines)
            .map { "> \($0)" }
            .joined(separator: "\n")

        var lines = [
            "## \(title)",
            "",
            quote,
            ""
        ]

        if !clip.annotation.isEmpty {
            lines += ["**批注：**  ", clip.annotation, ""]
        }

        lines += ["**类型：** \(clip.kind.rawValue)  "]
        if !clip.tags.isEmpty {
            lines += ["**标签：** \(clip.tags.joined(separator: " "))  "]
        }
        if let sourceApplication = clip.sourceApplication, !sourceApplication.isEmpty {
            lines += ["**来源：** \(sourceApplication)  "]
        }
        lines += ["**时间：** \(timestamp)", "", "---", "", ""]

        return lines.joined(separator: "\n")
    }

    private static let timestampFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "zh_CN")
        formatter.dateFormat = "yyyy-MM-dd HH:mm"
        return formatter
    }()
}
