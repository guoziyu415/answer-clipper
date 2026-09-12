# Chrome Web Store Listing Draft

## Name

Answer Clipper - Web Highlights & Notes

## Short description

Highlight web text, add annotations, and save to Google Docs, Markdown, plain text, or a local inbox.

## Detailed description

Answer Clipper helps you keep the parts of an article, blog, reference page, or AI answer that matter. It works on ordinary HTTP and HTTPS web pages, including ChatGPT.

After you select text, an **Annotate** button appears beside the selection. Add a thought, question, verification note, highlight, or tags. Choose Google Docs, Markdown, TXT, or the local inbox directly in the annotation dialog, then click its single Save button. The last saved choice is remembered. The extension never sends a message to the chat or creates another conversation turn.

Key features:

- Displays an annotation button after an intentional text selection
- Saves quotes with annotations, categories, and tags
- Appends entries to separate user-selected default Markdown and TXT files
- Downloads individual entries as Markdown or plain text with a user-chosen filename and location
- Exports the browser-local inbox
- Optionally appends individual annotations or the collected inbox to a selected Google Doc
- Clears the local inbox on explicit confirmation
- Collects notes from different websites with their own page titles and source links
- Serializes saves from multiple tabs to prevent lost updates
- Supports local HTML files after file access is enabled in Chrome
- Ignores selections in input fields and editable areas
- Local saving needs no account or network request; optional Google Docs uses a user-authorized Google connection

## Single purpose

Save text intentionally selected by the user on a web page, together with the user's annotation, to a local note or a Google document chosen by the user.

## Permission explanations

- `storage`: Stores the local annotation inbox and default-file settings on the user's device.
- `downloads`: Creates a Markdown or TXT file only when the user explicitly chooses to save or export content.
- `identity`: Connects the user's Google account for optional Google Docs saving, only after an explicit connection action.
- `https://docs.googleapis.com/*`: Reads the selected document to append content safely and prevent duplicate exports. Creates a document only when the user asks. The OAuth `documents` scope is required for the existing-document-link workflow and allows access to Google Docs; the extension does not scan unrelated documents.
- `http://*/*` and `https://*/*`: Detects intentional text selections and displays the annotation interface across websites. Broad page access supports clipping from the user's chosen sites; Chrome's site-access controls can restrict it.
- `file:///*`: Supports local HTML documents only when the user enables **Allow access to file URLs** in Chrome.

The extension supports standard text selections in top-level pages. It does not run on Chrome settings pages, the Chrome Web Store, or built-in PDF viewers, and cannot capture canvas-rendered text or embedded frames.

## Required before submission

- Host the privacy policy at a public URL
- Prepare a 1280 x 800 or 640 x 400 feature screenshot
- Prepare a 440 x 280 small promotional tile
- Register a Chrome Web Store developer account and enable two-step verification
- Configure a Google OAuth client for the published extension ID and complete the applicable Google verification for the sensitive Docs scope
- Accurately disclose local processing and optional user-directed transmission of annotations and source details to Google; do not claim that the Google-enabled extension makes no network requests
