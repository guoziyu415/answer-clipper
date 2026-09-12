# Answer Clipper for Chrome 0.6.0 Beta

This is a GitHub-distributed beta for local web annotation. It is not a Chrome Web Store listing. Downloads follow the repository's access permissions.

## Download and install

1. Download `Answer-Clipper-Chrome-v0.6.0.zip` from this release's Assets section. The automatic Source code archives are not required.
2. Unzip it into a permanent folder. Do not delete or move that folder after installation.
3. Open `chrome://extensions` in desktop Chrome and enable **Developer mode**.
4. Click **Load unpacked** and select the extracted folder containing `manifest.json`.
5. Pin Answer Clipper from Chrome's Extensions menu, then open or refresh the web page you want to annotate.

No npm installation, server, API key, or Google account is needed to save locally. This extension is for desktop Chrome, not the Chrome mobile app or the ChatGPT desktop app.

## Use

Select text on a supported page, click **Annotate**, add an optional note, choose **Save to**, and click the single **Save** button.

- **Markdown (.md)** or **Plain text (.txt):** choose a filename and location when saving. To append repeatedly to the same file, connect a separate reusable file for that format in Settings.
- **Local inbox (export later):** collect multiple excerpts, then export them together from the popup or Settings.
- **More options:** optional category and tags remain in the local annotation record.

Every saved annotation is stored locally first. For important notes, also keep an exported file. Compact exports do not include category, tags, or timestamps, and TXT omits the source URL. There is currently no full-fidelity backup/import feature, so keep the inbox if you need that metadata.

## Google Docs is experimental in this beta

The bundled OAuth configuration is for development and is not guaranteed to match another user's unpacked extension ID. Local saving is the supported starting workflow for beta testers. Public Google availability requires matching extension/OAuth configuration, the applicable Google verification, and real external-account testing.

Do not create your own Google Cloud project just to try the local annotation features. See [Google Docs setup](https://github.com/guoziyu415/answer-clipper/blob/main/docs/GOOGLE_DOCS.md) for maintainer instructions and limitations.

## Update an existing unpacked installation

Export a readable copy of important notes first. Replace the extension files in the same installed folder, click **Reload** on its card in `chrome://extensions`, and refresh the pages you use. Do not uninstall the extension to update it: uninstalling removes its local stored data. Moving to another path or extension ID may create a separate installation with separate storage.

## Known limitations

- Standard text selections in ordinary top-level web pages are supported. Editable inputs, passwords, embedded frames, canvas text, browser settings, the Chrome Web Store, and built-in PDF viewers are not supported.
- Local HTML pages require **Allow access to file URLs** in the extension's Details page.
- Rich document structure, screenshots, OCR, and PDF export are not implemented.
- Before connecting an existing Markdown or TXT file, leave a blank line after its final paragraph; this version does not automatically repair a missing separator when appending.
- Google integration tests use mocked identity and API services; they do not establish real account compatibility or live document layout.

## Other project components

This release also checkpoints the current project source, English documentation, screenshots, and test infrastructure. Only the Chrome extension is attached as an installable asset. The macOS and MCP implementations have known draft/editing issues from the cross-platform review and are not promoted as newly stabilized releases here.

## Verification

- Chrome: 37 unit tests and 19 isolated browser end-to-end checks.
- MCP: 7 unit/HTTP tests and a successful TypeScript/widget build.
- macOS: 11 Swift tests.
- English-only repository check and Git whitespace validation.

Passing these checks does not mean the known limitations above have been fixed. Report beta issues with synthetic excerpts, the Chrome version, and reproduction steps; do not include private conversations or credentials.
