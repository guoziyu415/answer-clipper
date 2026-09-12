import Foundation

enum ClipKind: String, CaseIterable, Identifiable {
    case thought = "Thought"
    case question = "Question"
    case verify = "Verify"
    case highlight = "Highlight"

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
        return defaultNoteURL
    }

    var defaultNoteURL: URL {
        FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Documents", isDirectory: true)
            .appendingPathComponent("AnswerClipper", isDirectory: true)
            .appendingPathComponent("Inbox.md", isDirectory: false)
    }

    func setNoteURL(_ url: URL) {
        defaults.set(url.path, forKey: Keys.notePath)
    }

    func resetNoteURL() {
        defaults.removeObject(forKey: Keys.notePath)
    }

    func ensureFileExists() throws {
        try ensureFileExists(at: noteURL)
    }

    func ensureFileExists(at url: URL) throws {
        let directory = url.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        if !FileManager.default.fileExists(atPath: url.path) {
            try "# Answer Clipper\n\n".write(to: url, atomically: true, encoding: .utf8)
        }
    }

    func append(_ clip: Clip, to destinationURL: URL? = nil) throws {
        let targetURL = destinationURL ?? noteURL
        try ensureFileExists(at: targetURL)
        guard let data = MarkdownFormatter.entry(for: clip).data(using: .utf8) else {
            throw CocoaError(.fileWriteInapplicableStringEncoding)
        }
        let handle = try FileHandle(forWritingTo: targetURL)
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
            lines += ["**Annotation:**  ", clip.annotation, ""]
        }

        lines += ["**Category:** \(clip.kind.rawValue)  "]
        if !clip.tags.isEmpty {
            lines += ["**Tags:** \(clip.tags.joined(separator: " "))  "]
        }
        if let sourceApplication = clip.sourceApplication, !sourceApplication.isEmpty {
            lines += ["**Source:** \(sourceApplication)  "]
        }
        lines += ["**Time:** \(timestamp)", "", "---", "", ""]

        return lines.joined(separator: "\n")
    }

    private static let timestampFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd HH:mm"
        return formatter
    }()
}
