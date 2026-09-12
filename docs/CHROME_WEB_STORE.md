# Chrome Web Store release preparation

## Current draft

Checked on September 12, 2026. This is an unpublished draft, not a public listing.

- Extension ID: `mkdeklipbgfjoibioofimhcklfikgmgo`
- Uploaded package version: `0.6.1`
- [Maintainer dashboard](https://chrome.google.com/webstore/devconsole/b26ec47b-5262-4b44-806c-c1f1d6ef82dd/mkdeklipbgfjoibioofimhcklfikgmgo/edit)
- Saved listing fields: English description, Tools category, English (United States), the 128 x 128 icon, two 1280 x 800 screenshots, homepage URL, support URL and privacy policy URL.
- The source repository is public, including its existing commit history, with the maintainer's approval.
- The English [homepage](https://guoziyu415.github.io/answer-clipper/) and [privacy policy](https://guoziyu415.github.io/answer-clipper/privacy.html) are publicly hosted on GitHub Pages. Both returned HTTP 200 after the successful [website deployment](https://github.com/guoziyu415/answer-clipper/actions/runs/34688870812).
- Public support contact: `guoziyu415@gmail.com`, explicitly confirmed by the maintainer. Chrome now displays **Verified email address**.
- Single-purpose description, downloads/storage/identity/host explanations, and the no-remote-code answer have been saved in the store draft. Data types disclosed: authentication information, personal communications, web history (saved source pages only), and website content. The three limited-use certifications still require the maintainer's confirmation.
- Google Branding now has the product icon, homepage, privacy policy and `guoziyu415.github.io` authorized domain. Google Search Console confirmed **Ownership verified** for the homepage URL-prefix property using the HTML meta tag. Keep this tag in `website/index.html`; this is not Google OAuth approval.
- The existing `answer-clipper` Google project now displays **In production**. No new project or OAuth client was created for this transition. Automated branding verification failed with a homepage-ownership finding despite the verified Search Console URL-prefix property. An explanation requesting manual review is drafted, not submitted; URL-prefix verification must not be represented as ownership of the parent `github.io` domain.
- The combined Google review form requires both a scope justification and a real YouTube demonstration. The justification is drafted in the existing project's Data Access page, but cannot be saved without the video URL. No real OAuth demonstration has been recorded or submitted. The store's saved test instructions now accurately say **In production**, with branding/scope review and live testing still pending.
- [Store screenshot capture](https://github.com/guoziyu415/answer-clipper/actions/runs/34688888427) passed all 20 browser checks and produced three 1280 x 800 RGB PNGs. The annotation and selection screenshots are suitable for the store; the settings screenshot only shows the top of the inbox section. The normal [CI run](https://github.com/guoziyu415/answer-clipper/actions/runs/34688870822) passed too.
- [CI for the uploaded source](https://github.com/guoziyu415/answer-clipper/actions/runs/34688017676) passed, including 40 Chrome unit tests and 20 isolated browser checks. Google identity and API responses in those tests are mocked.

The initial development-configured ZIP was replaced by `Answer-Clipper-Chrome-Web-Store-v0.6.1.zip`, SHA-256 `c573380f92bfdf3947dc728caf5af5ba87012e5b8e593eb0f576b51139101397`. The replacement uses the store-specific public key and OAuth client. The local unit suite now has 43 passing tests, including three store-identity checks. Google verification, live external-account testing, and the other gates below are still required before submission.

## Preserve existing installation and store identities

The existing development OAuth client is bound to extension ID `dkgiondcoadhpmmpinjdhdhmhgmlgnpm`. It must not be overwritten just to support the store ID.

The store ID, verified public key, and separate OAuth client are recorded in [chrome-web-store.json](../config/chrome-web-store.json). These values are public application configuration, not secrets. Both existing clients remain in the `answer-clipper` project. The maintainer explicitly requested promotion of this existing project instead of creating another project or client.

Treat this as the release project after promotion. Automated development tests must continue using mocked Google services, not production OAuth. Google's testing/production separation and client-readiness policies still apply; promotion is not a claim that all Google requirements or reviews have been completed. Do not delete, replace or rotate the existing installation's credentials without explicit authorization.

Run `node scripts/package-chrome-store.mjs` from the repository root to create the isolated store ZIP and checksum. The script validates the public key against the store ID and rejects the development OAuth client. It never edits the unpacked development manifest. An existing archive is not overwritten.

Do not insert this public key into an existing user's unpacked development manifest: changing the extension ID creates a separate installation and separate browser-local storage. Prepare a separate store build instead. An explicit data-migration workflow is not implemented; export important notes before switching installations and retain the development installation if full local metadata is needed.

## Remaining release gates

1. Keep the existing production project, store OAuth client and original installation client. Do not create another project or client; the maintainer explicitly declined that approach.
2. The isolated store package has been uploaded to the existing draft. Preserve this item ID for future updates and rerun validation when the configuration changes.
3. The English homepage and privacy policy are live on GitHub Pages; public email and website URL-prefix ownership are verified. Preserve the verification meta tag and confirm that Google's OAuth review accepts the supplied site.
4. Supply the real OAuth demonstration video and submit the prepared homepage-ownership explanation and scope justification. Complete branding verification/publication and sensitive Google Docs scope verification. **In production** is not **Verified**; the dashboard still shows a 100-user cap for unapproved scopes.
5. Validate Google login and saving with a real external account using the store identity. Check create/select, repeated appends and exports, failure recovery, and disconnect.
6. Two store-sized screenshots and reviewer instructions have been saved. Complete the three privacy certifications with the maintainer's confirmation. Remove the reviewer instructions' temporary Google release-gate note only after real authorization is ready.
7. Confirm all dashboard requirements and submit for review only when ready. Draft creation and successful CI are not publication or approval.

## Prepared Google review material

These drafts are retained here because the dashboard cannot save the scope form without a video. They are not evidence that a review was submitted.

### Scope justification

Answer Clipper lets users explicitly save selected excerpts and annotations to a Google Doc they create or choose by pasting an existing document URL. The documents scope is used for documents.create, documents.get and documents.batchUpdate. Reads locate the chosen tab, append position, revision and deduplication markers; writes append notes, formatting and markers. Read-only access cannot save notes. drive.file only covers files created by or explicitly opened with the app; pasting an arbitrary existing Doc URL does not grant that per-file authorization in the current workflow. We do not list, scan or delete other documents. Google requests go directly from the extension to the Docs API over HTTPS; no application server receives notes or documents. Google connection is optional and initiated by the user. Local inbox, Markdown and TXT work without Google. Both existing Chrome Extension clients use this same workflow.

### Homepage ownership explanation

The homepage is the GitHub Pages project site of the public repository https://github.com/guoziyu415/answer-clipper, maintained by the GitHub account guoziyu415. On September 12, 2026, Google Search Console confirmed Ownership verified for https://guoziyu415.github.io/answer-clipper/ using an HTML verification tag under guoziyu415@gmail.com, the account used for this Google Cloud project. The tag remains on the live homepage. The privacy policy is publicly accessible on the same host and linked from the homepage. Please manually review this ownership evidence and let us know if verification at a different URL scope is required. We do not claim ownership of the parent github.io domain.

### Real demonstration checklist

Use the existing project and clients. The Data Access form says the video must include every OAuth client assigned to this project. Do not create a new identity, replace an installed extension's manifest key, or use mocked authorization as evidence.

1. Use English UI and synthetic sample notes in a clean demonstration window, without unrelated private tabs or documents.
2. Show the extension identity and **Connect Google** flow, including the app name, requested Docs permission and client ID in the authorization URL. Do not record passwords, verification codes or access tokens. Any security prompt requiring the account owner's decision must be handled by that owner.
3. Show creating a sample Google Doc and saving an excerpt with an annotation. Open the actual document to show the saved result.
4. Show choosing an existing sample Doc by URL and appending a second note without replacing its previous contents. Demonstrate disconnecting afterward.
5. Cover both existing clients, using separate installations if necessary so the original installation and notes remain intact. Record the actual result; a failed operation is not a successful test.
6. Upload the reviewed recording to YouTube as **Unlisted** and supply that link to the existing Data Access form. Check that it is accessible to reviewers before submitting the review.

## References

- [Chrome OAuth and consistent extension IDs](https://developer.chrome.com/docs/extensions/how-to/integrate/oauth)
- [Google Docs authorization scopes](https://developers.google.com/workspace/docs/api/auth)
- [Google OAuth production-readiness requirements](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance)
- [Google sensitive-scope verification and demonstration requirements](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification)
- [Chrome Web Store image requirements](https://developer.chrome.com/docs/webstore/images)
