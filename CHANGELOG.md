# Changelog

## 0.6.2 (Chrome extension; live verification pending)

- Supply complete zero-width paragraph borders when resetting inherited Google Docs formatting
- Retry with basic text and duplicate-protection markers only after Google explicitly rejects a formatting operation with HTTP 400; reread the document before retrying
- Report when an annotation was saved with basic formatting instead of claiming that rich formatting succeeded
- Show HTTP status, a bounded API status code, and the failed request type without exposing raw Google error responses
- Preserve local notes, document selection, OAuth clients, and existing remote annotations
- Prepared in response to a real Google Docs save failure in 0.6.1; automated regression checks do not establish that the live failure is resolved

## 0.6.1 (Chrome extension)

- Preserve blank-line separation when appending to existing local Markdown and TXT files
- Prepare isolated Chrome Web Store packages without changing the local installation's identity

## 0.6.0 (Chrome extension)

- Replaced record-style exports with compact excerpts, one annotation, and a short source title
- Added native quote styling and small source hyperlinks in Google Docs without raw URL paragraphs or repeated headings
- Simplified Markdown to blockquotes and titled links, and TXT to quoted excerpts without metadata labels or long URLs
- Kept category, tags, timestamps, and full source URLs in the local inbox; moved optional category and tag controls under More options
- Preserved existing saved files and Google entries, including duplicate protection across the format update

## 0.5.0 (Chrome extension)

- Replaced the two annotation save buttons with one Save button and a per-annotation Save to selector
- Added Google Docs, Markdown, TXT, and local-inbox choices that remember the last saved destination
- Added genuine plain-text downloads, batch export, and a separate optional reusable TXT file
- Preserved existing Markdown file handles, Google configuration, and local annotations
- Kept failed file or cloud saves open with the draft and an actionable error instead of closing the dialog
- Made Google setup visible in Settings and refreshed the English instructions and real-browser screenshots

## 0.4.0 (Chrome extension)

- Added optional Google Docs connection, existing-document links, and new-document creation
- Added a Google Docs default destination and batch inbox export while preserving local copies
- Added per-tab tracking ranges and revision guards for duplicate-safe exports and concurrent document edits
- Added explicit OAuth setup instructions; Google login remains disabled in builds without a configured client ID
- Updated privacy disclosures and tests for optional cloud saving, connection boundaries, offline fallback, and retry behavior

## 0.3.0 (Chrome extension)

- Extended annotation to ordinary HTTP and HTTPS web pages, with local HTML support when Chrome file access is enabled
- Preserved each website's title and source link, including HTTP and local file URLs
- Excluded input fields, password fields, and editable areas from selection capture
- Updated the extension name, English UI, privacy policy, installation guide, and screenshots for general web annotation
- Expanded browser tests to cover different website origins, local HTML, and editor exclusions

## 0.2.0

- Converted all product UI, messages, exports, tests, and documentation to English
- Moved the Chrome local inbox from one `chrome.storage.local` array to IndexedDB
- Serialized Chrome saves across tabs and preserved a local copy when file writes fail
- Added local inbox export and confirmed clearing controls
- Added stale-selection suppression for the macOS floating annotation button
- Added universal macOS build support when full Xcode is available
- Added optional notarization support and a stable bundle identifier
- Restricted the MCP server to loopback, blocked cross-origin preview API access, bounded inputs, and versioned the widget resource
- Added continuous integration, an English-only repository check, an MIT license, and a security policy
- Added real Chromium extension tests and reproducible English README screenshots
- Updated dependencies to resolve known production audit findings
