import Foundation
import XCTest
@testable import AnswerClipper

final class MarkdownFormatterTests: XCTestCase {
    func testEntryKeepsQuoteAndAnnotationSeparate() {
        let clip = Clip(
            quote: "第一行\n第二行",
            annotation: "这是我的理解",
            kind: .thought,
            tags: ["#插件", "#想法"],
            sourceApplication: "Codex",
            createdAt: Date(timeIntervalSince1970: 0)
        )

        let markdown = MarkdownFormatter.entry(for: clip)

        XCTAssertTrue(markdown.contains("> 第一行\n> 第二行"))
        XCTAssertTrue(markdown.contains("**批注：**  \n这是我的理解"))
        XCTAssertTrue(markdown.contains("**标签：** #插件 #想法"))
        XCTAssertTrue(markdown.contains("**来源：** Codex"))
    }

    func testEntryOmitsEmptyAnnotationAndTags() {
        let clip = Clip(
            quote: "只保存原文",
            annotation: "",
            kind: .highlight,
            tags: [],
            sourceApplication: nil,
            createdAt: Date(timeIntervalSince1970: 0)
        )

        let markdown = MarkdownFormatter.entry(for: clip)

        XCTAssertFalse(markdown.contains("**批注：**"))
        XCTAssertFalse(markdown.contains("**标签：**"))
        XCTAssertTrue(markdown.contains("**类型：** 重点"))
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
