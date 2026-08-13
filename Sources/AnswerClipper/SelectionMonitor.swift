import AppKit

struct CapturedSelection {
    let text: String
    let sourceApplication: String?
    let screenPoint: NSPoint
}

final class SelectionMonitor {
    var onSelection: ((CapturedSelection) -> Void)?
    var onSelectionCleared: (() -> Void)?

    private let selectionCapture: SelectionCapture
    private var mouseDownMonitor: Any?
    private var mouseUpMonitor: Any?
    private var dismissMonitor: Any?
    private var mouseDownPoint: NSPoint?
    private var captureGeneration = 0

    init(selectionCapture: SelectionCapture) {
        self.selectionCapture = selectionCapture
    }

    func start() {
        guard mouseDownMonitor == nil else { return }

        mouseDownMonitor = NSEvent.addGlobalMonitorForEvents(matching: .leftMouseDown) { [weak self] _ in
            DispatchQueue.main.async {
                self?.mouseDownPoint = NSEvent.mouseLocation
            }
        }

        mouseUpMonitor = NSEvent.addGlobalMonitorForEvents(matching: .leftMouseUp) { [weak self] event in
            let point = NSEvent.mouseLocation
            let clickCount = event.clickCount
            DispatchQueue.main.async {
                self?.handleMouseUp(at: point, clickCount: clickCount)
            }
        }

        dismissMonitor = NSEvent.addGlobalMonitorForEvents(
            matching: [.rightMouseDown, .scrollWheel]
        ) { [weak self] _ in
            DispatchQueue.main.async {
                self?.invalidateCapture()
                self?.onSelectionCleared?()
            }
        }
    }

    func stop() {
        [mouseDownMonitor, mouseUpMonitor, dismissMonitor].forEach { monitor in
            if let monitor {
                NSEvent.removeMonitor(monitor)
            }
        }
        mouseDownMonitor = nil
        mouseUpMonitor = nil
        dismissMonitor = nil
        invalidateCapture()
    }

    private func handleMouseUp(at point: NSPoint, clickCount: Int) {
        let shouldInspect = Self.shouldInspectSelection(
            mouseDown: mouseDownPoint,
            mouseUp: point,
            clickCount: clickCount
        )
        mouseDownPoint = nil

        guard shouldInspect else {
            invalidateCapture()
            onSelectionCleared?()
            return
        }
        guard selectionCapture.isAccessibilityTrusted else { return }
        guard let sourceApplication = NSWorkspace.shared.frontmostApplication else { return }
        guard sourceApplication.processIdentifier != ProcessInfo.processInfo.processIdentifier else { return }

        captureGeneration += 1
        let generation = captureGeneration
        let sourceName = sourceApplication.localizedName
        let sourcePID = sourceApplication.processIdentifier

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) { [weak self] in
            guard let self, generation == self.captureGeneration else { return }

            self.selectionCapture.capture { [weak self] selectedText in
                guard let self, generation == self.captureGeneration else { return }
                guard NSWorkspace.shared.frontmostApplication?.processIdentifier == sourcePID else { return }

                let text = selectedText?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
                guard !text.isEmpty else {
                    self.onSelectionCleared?()
                    return
                }

                self.onSelection?(
                    CapturedSelection(
                        text: text,
                        sourceApplication: sourceName,
                        screenPoint: point
                    )
                )
            }
        }
    }

    private func invalidateCapture() {
        captureGeneration += 1
    }

    static func shouldInspectSelection(
        mouseDown: NSPoint?,
        mouseUp: NSPoint,
        clickCount: Int
    ) -> Bool {
        if clickCount >= 2 {
            return true
        }
        guard let mouseDown else { return false }
        return hypot(mouseUp.x - mouseDown.x, mouseUp.y - mouseDown.y) >= 4
    }
}
