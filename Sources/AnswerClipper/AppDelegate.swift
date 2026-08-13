import AppKit
import ApplicationServices
import Carbon

final class AppDelegate: NSObject, NSApplicationDelegate {
    static weak var shared: AppDelegate?

    private var statusItem: NSStatusItem?
    private var annotationPanel: AnnotationPanelController?
    private let noteStore = NoteStore()
    private let selectionCapture = SelectionCapture()
    private let hotKeys = GlobalHotKeys()
    private let toast = ToastController()

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
    }

    func applicationWillTerminate(_ notification: Notification) {
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
        menu.addItem(withTitle: "选择 Markdown 文件…", action: #selector(chooseNoteFile), keyEquivalent: "")
        menu.addItem(.separator())
        menu.addItem(withTitle: "辅助功能权限…", action: #selector(requestAccessibility), keyEquivalent: "")
        menu.addItem(withTitle: "退出 Answer Clipper", action: #selector(quit), keyEquivalent: "q")

        for menuItem in menu.items {
            menuItem.target = self
        }
        item.menu = menu
        statusItem = item
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
        let sourceApplication = NSWorkspace.shared.frontmostApplication?.localizedName

        selectionCapture.capture { [weak self] selectedText in
            guard let self else { return }
            guard let selectedText, !selectedText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                self.toast.show("没有读取到选中文字")
                return
            }

            if forAnnotation {
                self.showAnnotationPanel(text: selectedText, sourceApplication: sourceApplication)
            } else {
                do {
                    let clip = Clip(
                        quote: selectedText,
                        annotation: "",
                        kind: .highlight,
                        tags: [],
                        sourceApplication: sourceApplication,
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

    private func showAnnotationPanel(text: String, sourceApplication: String?) {
        let panel = AnnotationPanelController(
            quote: text,
            sourceApplication: sourceApplication,
            onSave: { [weak self] clip in
                guard let self else { return }
                do {
                    try self.noteStore.append(clip)
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
        let panel = NSSavePanel()
        panel.title = "选择 Markdown 笔记"
        panel.nameFieldStringValue = noteStore.noteURL.lastPathComponent
        panel.directoryURL = noteStore.noteURL.deletingLastPathComponent()
        panel.allowedContentTypes = [.init(filenameExtension: "md")!]
        panel.canCreateDirectories = true

        NSApp.activate(ignoringOtherApps: true)
        guard panel.runModal() == .OK, let url = panel.url else { return }
        noteStore.setNoteURL(url)
        do {
            try noteStore.ensureFileExists()
            toast.show("已更改保存位置")
        } catch {
            showError(error)
        }
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
