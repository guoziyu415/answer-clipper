import AppKit
import SwiftUI

struct AnnotationSaveRequest {
    let clip: Clip
    let destinationURL: URL
    let makeDefault: Bool
}

final class AnnotationPanelController: NSWindowController {
    init(
        quote: String,
        sourceApplication: String?,
        destinationURL: URL,
        onChooseDestination: @escaping (URL) -> URL?,
        onSave: @escaping (AnnotationSaveRequest) -> Void,
        onCancel: @escaping () -> Void
    ) {
        let panel = NSPanel(
            contentRect: NSRect(x: 0, y: 0, width: 520, height: 500),
            styleMask: [.titled, .closable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        panel.title = "添加批注"
        panel.level = .floating
        panel.isReleasedWhenClosed = false
        panel.hidesOnDeactivate = false
        panel.titlebarAppearsTransparent = true

        let view = AnnotationView(
            quote: quote,
            sourceApplication: sourceApplication,
            destinationURL: destinationURL,
            onChooseDestination: onChooseDestination,
            onSave: onSave,
            onCancel: onCancel
        )
        panel.contentView = NSHostingView(rootView: view)
        super.init(window: panel)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    func showNearPointer() {
        guard let window else { return }
        let pointer = NSEvent.mouseLocation
        let visibleFrame = NSScreen.screens.first(where: { $0.frame.contains(pointer) })?.visibleFrame
            ?? NSScreen.main?.visibleFrame
            ?? .zero

        var origin = NSPoint(x: pointer.x + 16, y: pointer.y - window.frame.height - 16)
        origin.x = min(max(origin.x, visibleFrame.minX + 12), visibleFrame.maxX - window.frame.width - 12)
        origin.y = min(max(origin.y, visibleFrame.minY + 12), visibleFrame.maxY - window.frame.height - 12)
        window.setFrameOrigin(origin)

        NSApp.activate(ignoringOtherApps: true)
        showWindow(nil)
        window.makeKeyAndOrderFront(nil)

        DispatchQueue.main.async { [weak window] in
            guard let window,
                  let textView = window.contentView?.firstDescendant(of: NSTextView.self)
            else { return }
            window.makeFirstResponder(textView)
        }
    }
}

private extension NSView {
    func firstDescendant<T: NSView>(of type: T.Type) -> T? {
        if let matchingView = self as? T {
            return matchingView
        }
        for subview in subviews {
            if let matchingView = subview.firstDescendant(of: type) {
                return matchingView
            }
        }
        return nil
    }
}

private struct AnnotationView: View {
    let quote: String
    let sourceApplication: String?
    let onChooseDestination: (URL) -> URL?
    let onSave: (AnnotationSaveRequest) -> Void
    let onCancel: () -> Void

    @State private var annotation = ""
    @State private var tags = ""
    @State private var kind: ClipKind = .thought
    @State private var destinationURL: URL
    @State private var makeDefault = false
    @FocusState private var annotationFocused: Bool

    init(
        quote: String,
        sourceApplication: String?,
        destinationURL: URL,
        onChooseDestination: @escaping (URL) -> URL?,
        onSave: @escaping (AnnotationSaveRequest) -> Void,
        onCancel: @escaping () -> Void
    ) {
        self.quote = quote
        self.sourceApplication = sourceApplication
        self.onChooseDestination = onChooseDestination
        self.onSave = onSave
        self.onCancel = onCancel
        _destinationURL = State(initialValue: destinationURL)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("选中的内容")
                .font(.headline)

            ScrollView {
                Text(quote)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .textSelection(.enabled)
                    .padding(10)
            }
            .frame(height: 110)
            .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))

            Text("批注")
                .font(.headline)

            TextEditor(text: $annotation)
                .font(.body)
                .focused($annotationFocused)
                .frame(minHeight: 90)
                .padding(6)
                .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 8))

            HStack(spacing: 12) {
                Picker("类型", selection: $kind) {
                    ForEach(ClipKind.allCases) { kind in
                        Text(kind.rawValue).tag(kind)
                    }
                }
                .frame(width: 155)

                TextField("标签，用空格或逗号分隔", text: $tags)
                    .textFieldStyle(.roundedBorder)
            }

            HStack(spacing: 8) {
                Image(systemName: "doc.text")
                    .foregroundStyle(.secondary)
                Text(displayPath(destinationURL))
                    .font(.caption)
                    .lineLimit(1)
                    .truncationMode(.middle)
                    .help(destinationURL.path)
                Spacer()
                Button("更改本次位置…") {
                    if let chosenURL = onChooseDestination(destinationURL) {
                        destinationURL = chosenURL
                    }
                }
            }

            Toggle("将此位置设为以后默认位置", isOn: $makeDefault)
                .font(.caption)

            HStack {
                if let sourceApplication {
                    Text("来源：\(sourceApplication)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Button("取消", action: onCancel)
                    .keyboardShortcut(.cancelAction)
                Button("保存") {
                    onSave(
                        AnnotationSaveRequest(
                            clip: Clip(
                                quote: quote,
                                annotation: annotation.trimmingCharacters(in: .whitespacesAndNewlines),
                                kind: kind,
                                tags: parseTags(tags),
                                sourceApplication: sourceApplication,
                                createdAt: Date()
                            ),
                            destinationURL: destinationURL,
                            makeDefault: makeDefault
                        )
                    )
                }
                .keyboardShortcut(.return, modifiers: .command)
                .buttonStyle(.borderedProminent)
            }
        }
        .padding(20)
        .frame(width: 520, height: 500)
        .onAppear {
            annotationFocused = true
        }
    }

    private func parseTags(_ input: String) -> [String] {
        input
            .components(separatedBy: CharacterSet(charactersIn: ",， \n\t"))
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .map { $0.hasPrefix("#") ? $0 : "#\($0)" }
    }

    private func displayPath(_ url: URL) -> String {
        let homePath = FileManager.default.homeDirectoryForCurrentUser.path
        if url.path.hasPrefix(homePath) {
            return "~" + url.path.dropFirst(homePath.count)
        }
        return url.path
    }
}
