import AppKit
import ApplicationServices

final class SelectionCapture {
    var isAccessibilityTrusted: Bool {
        AXIsProcessTrusted()
    }

    func requestAccessibilityPermission() {
        let options = [
            kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true
        ] as CFDictionary
        _ = AXIsProcessTrustedWithOptions(options)
    }

    /// Electron/Chromium keeps its web accessibility tree disabled until an
    /// assistive client asks for it. This does not access the clipboard.
    func prepareApplication(processIdentifier: pid_t) {
        guard AXIsProcessTrusted() else { return }
        let application = AXUIElementCreateApplication(processIdentifier)
        _ = AXUIElementSetAttributeValue(
            application,
            "AXManualAccessibility" as CFString,
            kCFBooleanTrue
        )
        _ = AXUIElementSetAttributeValue(
            application,
            "AXEnhancedUserInterface" as CFString,
            kCFBooleanTrue
        )
    }

    func capture(
        in processIdentifier: pid_t,
        completion: @escaping (String?) -> Void
    ) {
        prepareApplication(processIdentifier: processIdentifier)

        DispatchQueue.global(qos: .userInitiated).asyncAfter(deadline: .now() + 0.06) {
            let selectedText = Self.selectedText(in: processIdentifier)
            DispatchQueue.main.async {
                completion(selectedText)
            }
        }
    }

    private static func selectedText(in processIdentifier: pid_t) -> String? {
        let application = AXUIElementCreateApplication(processIdentifier)

        if let focused = elementAttribute(application, kAXFocusedUIElementAttribute),
           let text = selectedText(from: focused) {
            return text
        }

        let system = AXUIElementCreateSystemWide()
        if let focused = elementAttribute(system, kAXFocusedUIElementAttribute),
           let text = selectedText(from: focused) {
            return text
        }

        // Chromium exposes document selections on its AXWebArea. Search the
        // enabled tree with a hard cap so a malformed hierarchy cannot stall.
        var queue: [AXUIElement] = [application]
        var index = 0
        let maximumElements = 4_000

        while index < queue.count, index < maximumElements {
            let element = queue[index]
            index += 1

            if let text = selectedText(from: element) {
                return text
            }
            queue.append(contentsOf: children(of: element))
        }
        return nil
    }

    private static func selectedText(from element: AXUIElement) -> String? {
        if let text = stringAttribute(element, kAXSelectedTextAttribute),
           !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return text
        }

        var markerRange: CFTypeRef?
        let rangeStatus = AXUIElementCopyAttributeValue(
            element,
            "AXSelectedTextMarkerRange" as CFString,
            &markerRange
        )
        guard rangeStatus == .success, let markerRange else { return nil }

        var value: CFTypeRef?
        let textStatus = AXUIElementCopyParameterizedAttributeValue(
            element,
            "AXStringForTextMarkerRange" as CFString,
            markerRange,
            &value
        )
        guard textStatus == .success,
              let text = value as? String,
              !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        else { return nil }
        return text
    }

    private static func stringAttribute(
        _ element: AXUIElement,
        _ attribute: String
    ) -> String? {
        var value: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element, attribute as CFString, &value) == .success
        else { return nil }
        return value as? String
    }

    private static func elementAttribute(
        _ element: AXUIElement,
        _ attribute: String
    ) -> AXUIElement? {
        var value: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element, attribute as CFString, &value) == .success,
              let value,
              CFGetTypeID(value) == AXUIElementGetTypeID()
        else { return nil }
        return unsafeBitCast(value, to: AXUIElement.self)
    }

    private static func children(of element: AXUIElement) -> [AXUIElement] {
        var value: CFTypeRef?
        guard AXUIElementCopyAttributeValue(
            element,
            kAXChildrenAttribute as CFString,
            &value
        ) == .success,
              let rawChildren = value as? [CFTypeRef]
        else { return [] }

        return rawChildren.compactMap { child in
            guard CFGetTypeID(child) == AXUIElementGetTypeID() else { return nil }
            return unsafeBitCast(child, to: AXUIElement.self)
        }
    }
}
