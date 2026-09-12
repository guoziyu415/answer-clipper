import Foundation
import XCTest
@testable import AnswerClipper

final class MarkdownFormatterTests: XCTestCase {
    func testEntryKeepsQuoteAndAnnotationSeparate() {
        let clip = Clip(
            quote: "First line\nSecond line",
            annotation: "My takeaway",
            kind: .thought,
            tags: ["#plugin", "#idea"],
            sourceApplication: "Codex",
            createdAt: Date(timeIntervalSince1970: 0)
        )

        let markdown = MarkdownFormatter.entry(for: clip)

        XCTAssertTrue(markdown.contains("> First line\n> Second line"))
        XCTAssertTrue(markdown.contains("**Annotation:**  \nMy takeaway"))
        XCTAssertTrue(markdown.contains("**Tags:** #plugin #idea"))
        XCTAssertTrue(markdown.contains("**Source:** Codex"))
    }

    func testEntryOmitsEmptyAnnotationAndTags() {
        let clip = Clip(
            quote: "Save only the quote",
            annotation: "",
            kind: .highlight,
            tags: [],
            sourceApplication: nil,
            createdAt: Date(timeIntervalSince1970: 0)
        )

        let markdown = MarkdownFormatter.entry(for: clip)

        XCTAssertFalse(markdown.contains("**Annotation:**"))
        XCTAssertFalse(markdown.contains("**Tags:**"))
        XCTAssertTrue(markdown.contains("**Category:** Highlight"))
    }

    func testNoteStoreCanResetCustomDefaultLocation() {
        let suiteName = "AnswerClipperTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer { defaults.removePersistentDomain(forName: suiteName) }
        let store = NoteStore(defaults: defaults)
        let customURL = URL(fileURLWithPath: "/tmp/custom-answer-clipper.md")

        store.setNoteURL(customURL)
        XCTAssertEqual(store.noteURL, customURL)

        store.resetNoteURL()
        XCTAssertEqual(store.noteURL, store.defaultNoteURL)
    }
}
