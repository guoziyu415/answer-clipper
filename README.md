# Answer Clipper

Answer Clipper is a local-first annotation tool for saving only the parts of an AI answer that matter. Select text, add a note, and append it to a Markdown file without sending another chat message or interrupting your reading flow.

The project includes a macOS app for system-wide annotation, a Chrome extension for ChatGPT on the web, and an experimental MCP app.

## Features

- Shows an **Annotate** button next to a real text selection
- Saves the selected quote with an optional annotation, category, and tags
- Supports repeated clipping into one Markdown file
- Lets you choose a destination for each clip or set a default file
- Records the source application and save time
- Provides `Option-Command-A` to annotate and `Option-Command-S` to save quickly
- Works locally without an account, AI API, or network request
- Does not read, clear, or modify the system clipboard

## Download

Download the latest macOS app from [GitHub Releases](https://github.com/guoziyu415/answer-clipper/releases/latest). The Chrome extension is included directly in the repository under `chrome-extension`.

## macOS app

The macOS app works with ChatGPT Desktop, browsers, PDF readers, and other applications that expose selected text through macOS Accessibility.

### Install a release

1. Download `Answer-Clipper-macOS-v0.1.0.zip` from GitHub Releases.
2. Unzip it and move `Answer Clipper.app` to `Applications`.
3. Open the app. If macOS blocks the first launch, right-click the app, choose **Open**, and confirm.
4. Select **Accessibility Permission...** from the highlighter icon in the menu bar.
5. Enable Answer Clipper in **System Settings > Privacy & Security > Accessibility**.
6. Select text in any supported app and click the floating **Annotate** button.
7. Add a note and press `Command-Enter` to save.

The default destination is `~/Documents/AnswerClipper/Inbox.md`. You can choose another Markdown file for one clip, make it the new default, or change the default later from the menu bar.

### Build from source

Install Xcode Command Line Tools or Xcode, then run:

```bash
./scripts/build-app.sh
```

Open `build/Answer Clipper.app` and grant Accessibility permission when prompted.

For a stable development signature that preserves Accessibility permission across rebuilds:

```bash
CODE_SIGN_IDENTITY="Apple Development: your-name@example.com (TEAMID)" ./scripts/build-app.sh
```

Without `CODE_SIGN_IDENTITY`, the build script uses a local ad-hoc signature.

## Chrome extension

The Chrome extension works on `chatgpt.com`. It does not require macOS Accessibility permission and cannot read the ChatGPT desktop app.

### Install from GitHub

1. Download the repository with **Code > Download ZIP**, or clone it with Git.
2. Unzip the repository archive if necessary.
3. Open `chrome://extensions` in Chrome.
4. Enable **Developer mode**.
5. Select **Load unpacked** and choose the repository's `chrome-extension` folder.
6. Open or refresh `https://chatgpt.com`.
7. Select text in an answer and click **Annotate**.

Each annotation is saved to the extension's local inbox first. You can connect a default Markdown file, save one annotation to a separate file, or export the entire inbox.

Run the extension tests:

```bash
cd chrome-extension
npm test
```

Create a Chrome Web Store upload archive:

```bash
./scripts/package-chrome-extension.sh
```

See [STORE_LISTING.md](chrome-extension/STORE_LISTING.md) for listing copy and permission explanations, and [PRIVACY.md](chrome-extension/PRIVACY.md) for the privacy policy.

## Experimental MCP app

`plugins/answer-clipper` provides an optional in-chat workspace for collecting, editing, reordering, and exporting clips. Because ChatGPT widgets run in an isolated iframe, the MCP version cannot directly capture text selected in the surrounding conversation. The macOS app or Chrome extension is recommended for selection-based annotation.

See [plugins/answer-clipper/README.md](plugins/answer-clipper/README.md) for development instructions.

## Development

The macOS app uses Swift Package Manager, has no third-party dependencies, and supports macOS 13 or later.

Run the Swift tests:

```bash
swift test
```

## Markdown format

Each entry keeps the quote, optional annotation, category, tags, source, and timestamp separate:

```markdown
## My takeaway

> The selected part of the answer.

**Annotation:**
My takeaway

**Category:** Thought
**Tags:** #plugin #notes
**Source:** ChatGPT
**Time:** 2026-08-14 00:10
```

## Privacy

Answer Clipper works locally. It does not call an AI model or create new chat messages. Chrome extension data remains in browser storage or a Markdown file selected by the user. The macOS app writes only to the Markdown file selected by the user.
