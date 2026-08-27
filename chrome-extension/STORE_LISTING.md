# Chrome Web Store Listing Draft

## Name

Answer Clipper - Annotate ChatGPT Answers

## Short description

Select parts of ChatGPT answers, add annotations, and save them to a local Markdown file.

## Detailed description

Answer Clipper helps you keep only the parts of a ChatGPT answer that matter.

After you select text, an **Annotate** button appears beside the selection. Add a thought, question, verification note, highlight, or tags, then save the entry to the extension's local inbox, append it to a default Markdown file, or download it separately. The extension never sends a message to the chat or creates another conversation turn.

Key features:

- Displays an annotation button after an intentional text selection
- Saves quotes with annotations, categories, and tags
- Appends entries to a user-selected default Markdown file
- Downloads individual entries as Markdown
- Exports the browser-local inbox
- Uses no server, account, or network request

## Single purpose

Save text intentionally selected by the user on ChatGPT, together with the user's annotation, to a Markdown note on the user's device.

## Permission explanations

- `storage`: Stores the local annotation inbox and default-file settings on the user's device.
- `downloads`: Creates a Markdown file only when the user explicitly chooses to save or export content.
- `https://chatgpt.com/*` and `https://chat.openai.com/*`: Detects intentional text selections and displays the annotation interface on supported ChatGPT pages.

## Required before submission

- Host the privacy policy at a public URL
- Prepare a 1280 x 800 or 640 x 400 feature screenshot
- Prepare an optional 440 x 280 small promotional tile
- Register a Chrome Web Store developer account and enable two-step verification
- Declare that the extension does not collect or transmit user data and processes data locally
