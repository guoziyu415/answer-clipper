# Google Docs destination

Google Docs is an optional Chrome extension feature. Local saving works without Google setup. A build without an OAuth client shows **Setup required**. A configured client must match the installed extension ID and its Google testing audience; a developer's client does not automatically enable Google login for other unpacked installations.

## One-time maintainer setup

1. Open the [Google Cloud console](https://console.cloud.google.com/) and select the project you want to use for Answer Clipper.
2. Enable the [Google Docs API](https://console.cloud.google.com/apis/library/docs.googleapis.com).
3. Configure Google Auth Platform branding, audience, and data access. For a testing audience, add the accounts that will test the app.
4. Add `https://www.googleapis.com/auth/documents` to the requested scopes.
5. Load the unpacked extension and copy its ID from `chrome://extensions`.
6. Create an OAuth client of type **Chrome Extension** for that exact extension ID, following [Chrome's OAuth instructions](https://developer.chrome.com/docs/extensions/how-to/integrate/oauth).
7. From the repository root, run:

```bash
node scripts/configure-google-oauth.mjs YOUR_CLIENT_ID.apps.googleusercontent.com
```

8. Reload the extension, open its settings, and select **Connect Google**.

The client ID is public configuration, not a password. Do not enter a client secret or API key. Moving an unpacked extension to another folder or publishing with a different extension ID may require a matching OAuth client configuration. Preserve the published extension ID with Chrome's documented public-key workflow when preparing a release.

This implementation uses the Docs `documents` scope to support an existing document chosen by its link without a separately hosted Google Picker. Google's consent screen permits access to the user's Google documents; it is not limited to one file by the scope itself. Answer Clipper only reads and appends to the document selected in its settings and creates a document only on request. Public distribution is subject to Google's [sensitive-scope verification requirements](https://developers.google.com/workspace/docs/api/auth). If the integration is redesigned around per-file authorization with Google Picker, the narrower `drive.file` scope is preferable.

## Save annotations

1. Select **Configure Save Destinations** in the popup and expand **Google Docs**.
2. Select **Connect Google** and authorize the account that can edit your destination document.
3. Paste a Google Docs link and select **Use This Document**, or enter a title and select **Create Google Doc**.
4. In the annotation dialog, choose **Google Docs** under **Save to**. The document title appears below it. Click the single **Save** button to append the annotation. This choice is remembered for the next annotation, but you can select Markdown, TXT, or the local inbox at any time.
5. Alternatively, choose **Local inbox (export later)** while reading and use **Export Inbox to Google Docs** when ready to send the collected annotations. Connecting Google or choosing a document does not automatically enable cloud saves.

Document links may include `?tab=...` to select a tab, including a nested tab. Without that parameter, the first document tab is used. The chosen document and tab are displayed in settings. Each new entry has an indented quote with a subtle left border, the annotation once beneath it, and a smaller source title linked to the original web page. Category, tags, and timestamps stay in the local inbox rather than appearing as fields in the document. Local-file sources keep a title without a Google hyperlink.

Formatting applies only to newly appended content. Existing paragraphs, earlier exports, and their source links are not rewritten. Deduplication still skips entries already in the chosen document tab; a format update does not append a second copy of an old note.

## Errors and duplicate protection

- Every annotation is stored locally before attempting a Google write.
- A network, permission, or API error leaves it in the inbox and keeps the annotation dialog open with your draft and an error. Retry or choose another destination. It does not launch an unexpected sign-in window while you are reading.
- Reconnect from settings if authorization expires, then select **Export Inbox to Google Docs** to recover unsent notes.
- Remote named ranges identify clips already written to each document tab. Re-export skips those clips, including after an uncertain network response. Deleting or changing those tracking ranges in Google Docs can remove the duplicate protection.
- Writes include a revision guard. A rejected revision is reread before a bounded retry. Network failures are not blindly retried.
- Large exports are sent in bounded batches. If a later batch fails, retrying the export skips earlier batches already present.
- Creating a document is not automatically retried. If the creation response is lost, check Google Docs for the document before creating it again.

**Disconnect Google** clears this extension's cached authorization and selected document and restores local saving. It does not delete documents or local notes. The account's [Google connections page](https://myaccount.google.com/connections) can revoke the app's grant.

## Validation status

Automated tests cover URL and tab validation, OAuth error handling, exact append requests, UTF-16 ranges, revision conflicts, repeated exports, lost responses, and offline retention. Browser tests exercise the real extension UI and service worker with Google identity and HTTP test doubles. They do not prove that an OAuth client is registered correctly or that live Google authorization succeeds.

Before sharing a Google-enabled release, test with a real configured client and a test account: connect, create a document, append twice, export twice, verify only one copy of each clip, revoke permission, retry, and disconnect. Also test a multi-tab document and an existing document with other content.
