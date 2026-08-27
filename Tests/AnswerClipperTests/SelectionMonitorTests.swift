import AppKit
import XCTest
@testable import AnswerClipper

final class SelectionMonitorTests: XCTestCase {
    func testMissingSelectionDoesNotPresentBubble() {
        XCTAssertFalse(SelectionMonitor.hasMeaningfulSelection(nil))
        XCTAssertFalse(SelectionMonitor.hasMeaningfulSelection(""))
        XCTAssertFalse(SelectionMonitor.hasMeaningfulSelection("  \n\t"))
    }

    func testRealTextSelectionPresentsBubble() {
        XCTAssertTrue(SelectionMonitor.hasMeaningfulSelection("选中的文字"))
    }

    func testDragTriggersSelectionInspection() {
        XCTAssertTrue(
            SelectionMonitor.shouldInspectSelection(
                mouseDown: NSPoint(x: 10, y: 10),
                mouseUp: NSPoint(x: 20, y: 10),
                clickCount: 1
            )
        )
    }

    func testDoubleClickTriggersSelectionInspection() {
        XCTAssertTrue(
            SelectionMonitor.shouldInspectSelection(
                mouseDown: NSPoint(x: 10, y: 10),
                mouseUp: NSPoint(x: 10, y: 10),
                clickCount: 2
            )
        )
    }

    func testOrdinaryClickDoesNotTriggerSelectionInspection() {
        XCTAssertFalse(
            SelectionMonitor.shouldInspectSelection(
                mouseDown: NSPoint(x: 10, y: 10),
                mouseUp: NSPoint(x: 11, y: 11),
                clickCount: 1
            )
        )
    }
}
