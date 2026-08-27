import AppKit
import ApplicationServices
import Carbon

final class AppDelegate: NSObject, NSApplicationDelegate {
    static weak var shared: AppDelegate?

    private var statusItem: NSStatusItem?
    private var currentLocationMenuItem: NSMenuItem?
    private var annotationPanel: AnnotationPanelController?
    private let noteStore = NoteStore()
    private let selectionCapture = SelectionCapture()
    private let hotKeys = GlobalHotKeys()
    private let toast = ToastController()
    private let selectionBubble = SelectionBubbleController()
    private lazy var selectionMonitor = SelectionMonitor(selectionCapture: selectionCapture)

    func applicationDidFinishLaunching(_ notification: Notification) {
        Self.shared = self
        NSApp.setActivationPolicy(.accessory)
        configureStatusItem()

        hotKeys.onAnnotation = { [weak self] in
            self?.captureSelection(forAnnotation: true)
        }
        hotKeys.onQuickSave = { [weak self] in
            self?.captureSelection(forAnnotation: false)
        }
        hotKeys.register()

        selectionMonitor.onSelection = { [weak self] selection in
            self?.showSelectionBubble(for: selection)
        }
        selectionMonitor.onSelectionCleared = { [weak self] in
            self?.selectionBubble.hide()
        }
        selectionMonitor.start()
    }

    func applicationWillTerminate(_ notification: Notification) {
        selectionMonitor.stop()
        hotKeys.unregister()
    }

    private func configureStatusItem() {
        let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        item.button?.image = NSImage(
            systemSymbolName: "highlighter",
            accessibilityDescription: "Answer Clipper"
        )

        let menu = NSMenu()
        menu.addItem(withTitle: "批注选中文字  ⌥⌘A", action: #selector(annotateSelection), keyEquivalent: "")
        menu.addItem(withTitle: "快速保存  ⌥⌘S", action: #selector(quickSaveSelection), keyEquivalent: "")
        menu.addItem(.separator())
        menu.addItem(withTitle: "打开 Markdown 笔记", action: #selector(openNote), keyEquivalent: "")
        let locationItem = NSMenuItem(title: "", action: nil, keyEquivalent: "")
        locationItem.isEnabled = false
        menu.addItem(locationItem)
        currentLocationMenuItem = locationItem
        menu.addItem(withTitle: "更改默认保存文件…", action: #selector(chooseNoteFile), keyEquivalent: "")
        menu.addItem(withTitle: "恢复默认保存位置", action: #selector(resetNoteFile), keyEquivalent: "")
        menu.addItem(.separator())
        menu.addItem(withTitle: "辅助功能权限…", action: #selector(requestAccessibility), keyEquivalent: "")
        menu.addItem(withTitle: "退出 Answer Clipper", action: #selector(quit), keyEquivalent: "q")

        for menuItem in menu.items {
            menuItem.target = self
        }
        item.menu = menu
        statusItem = item
        updateLocationMenuItem()
    }

    @objc private func annotateSelection() {
        captureSelection(forAnnotation: true)
    }

    @objc private func quickSaveSelection() {
        captureSelection(forAnnotation: false)
    }

    func handleHotKey(id: UInt32) {
        switch id {
        case 1:
            annotateSelection()
        case 2:
            quickSaveSelection()
        default:
            break
        }
    }

    private func captureSelection(forAnnotation: Bool) {
        selectionBubble.hide()

        guard selectionCapture.isAccessibilityTrusted else {
            selectionCapture.requestAccessibilityPermission()
            toast.show("请先授予辅助功能权限")
            return
        }

        guard let sourceApplication = NSWorkspace.shared.frontmostApplication else { return }

        selectionCapture.capture(in: sourceApplication.processIdentifier) { [weak self] selectedText in
            guard let self else { return }
            guard let selectedText, !selectedText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                self.toast.show("没有读取到选中文字")
                return
            }

            if forAnnotation {
                self.showAnnotationPanel(
                    text: selectedText,
                    sourceApplication: sourceApplication.localizedName
                )
            } else {
                do {
                    let clip = Clip(
                        quote: selectedText,
                        annotation: "",
                        kind: .highlight,
                        tags: [],
                        sourceApplication: sourceApplication.localizedName,
                        createdAt: Date()
                    )
                    try self.noteStore.append(clip)
                    self.toast.show("已保存到 Markdown")
                } catch {
                    self.showError(error)
                }
            }
        }
    }

    private func showSelectionBubble(for selection: CapturedSelection) {
        selectionBubble.show(at: selection.screenPoint) { [weak self] in
            self?.showAnnotationPanel(
                text: selection.text,
                sourceApplication: selection.sourceApplication
            )
        }
    }

    private func showAnnotationPanel(text: String, sourceApplication: String?) {
        selectionBubble.hide()
        let panel = AnnotationPanelController(
            quote: text,
            sourceApplication: sourceApplication,
            destinationURL: noteStore.noteURL,
            onChooseDestination: { [weak self] currentURL in
                self?.pickNoteURL(startingAt: currentURL)
            },
            onSave: { [weak self] request in
                guard let self else { return }
                do {
                    if request.makeDefault {
                        self.noteStore.setNoteURL(request.destinationURL)
                        self.updateLocationMenuItem()
                    }
                    try self.noteStore.append(request.clip, to: request.destinationURL)
                    self.annotationPanel?.close()
                    self.annotationPanel = nil
                    self.toast.show("批注已保存")
                } catch {
                    self.showError(error)
                }
            },
            onCancel: { [weak self] in
                self?.annotationPanel?.close()
                self?.annotationPanel = nil
            }
        )
        annotationPanel?.close()
        annotationPanel = panel
        panel.showNearPointer()
    }

    @objc private func openNote() {
        do {
            try noteStore.ensureFileExists()
            NSWorkspace.shared.open(noteStore.noteURL)
        } catch {
            showError(error)
        }
    }

    @objc private func chooseNoteFile() {
        guard let url = pickNoteURL(startingAt: noteStore.noteURL) else { return }
        noteStore.setNoteURL(url)
        updateLocationMenuItem()
        do {
            try noteStore.ensureFileExists()
            toast.show("已更改默认保存位置")
        } catch {
            showError(error)
        }
    }

    @objc private func resetNoteFile() {
        noteStore.resetNoteURL()
        updateLocationMenuItem()
        toast.show("已恢复默认保存位置")
    }

    private func pickNoteURL(startingAt currentURL: URL) -> URL? {
        let panel = NSSavePanel()
        panel.title = "选择 Markdown 笔记"
        panel.nameFieldStringValue = currentURL.lastPathComponent
        panel.directoryURL = currentURL.deletingLastPathComponent()
        panel.allowedContentTypes = [.init(filenameExtension: "md")!]
        panel.canCreateDirectories = true

        NSApp.activate(ignoringOtherApps: true)
        guard panel.runModal() == .OK else { return nil }
        return panel.url
    }

    private func updateLocationMenuItem() {
        currentLocationMenuItem?.title = "默认保存到：\(abbreviatedPath(noteStore.noteURL))"
    }

    private func abbreviatedPath(_ url: URL) -> String {
        let homePath = FileManager.default.homeDirectoryForCurrentUser.path
        if url.path.hasPrefix(homePath) {
            return "~" + url.path.dropFirst(homePath.count)
        }
        return url.path
    }

    @objc private func requestAccessibility() {
        selectionCapture.requestAccessibilityPermission()
    }

    @objc private func quit() {
        NSApp.terminate(nil)
    }

    private func showError(_ error: Error) {
        let alert = NSAlert()
        alert.alertStyle = .warning
        alert.messageText = "保存失败"
        alert.informativeText = error.localizedDescription
        alert.addButton(withTitle: "好")
        NSApp.activate(ignoringOtherApps: true)
        alert.runModal()
    }
}
