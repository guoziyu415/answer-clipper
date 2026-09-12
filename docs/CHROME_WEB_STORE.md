# Chrome Web Store release preparation

## Current draft

Checked on September 12, 2026. This is an unpublished draft, not a public listing.

- Extension ID: `mkdeklipbgfjoibioofimhcklfikgmgo`
- Uploaded package version: `0.6.1`
- [Maintainer dashboard](https://chrome.google.com/webstore/devconsole/b26ec47b-5262-4b44-806c-c1f1d6ef82dd/mkdeklipbgfjoibioofimhcklfikgmgo/edit)
- Saved listing fields: English description, Tools category, English (United States), and the 128 x 128 icon.
- The source repository is public, including its existing commit history, with the maintainer's approval.
- [CI for the uploaded source](https://github.com/guoziyu415/answer-clipper/actions/runs/34688017676) passed, including 40 Chrome unit tests and 20 isolated browser checks. Google identity and API responses in those tests are mocked.

The initial development-configured ZIP was replaced by `Answer-Clipper-Chrome-Web-Store-v0.6.1.zip`, SHA-256 `c573380f92bfdf3947dc728caf5af5ba87012e5b8e593eb0f576b51139101397`. The replacement uses the store-specific public key and OAuth client. The local unit suite now has 43 passing tests, including three store-identity checks. Domain verification, live external-account testing, and the other gates below are still required before submission.

## Keep development and store identities separate

The existing development OAuth client is bound to extension ID `dkgiondcoadhpmmpinjdhdhmhgmlgnpm`. It must not be overwritten just to support the store ID.

The store ID, verified public key, and separate OAuth client are recorded in [chrome-web-store.json](../config/chrome-web-store.json). These values are public application configuration, not secrets. The maintainer authorized creation of the separate client; both clients currently belong to the Answer Clipper project, which remains in Testing.

Run `node scripts/package-chrome-store.mjs` from the repository root to create the isolated store ZIP and checksum. The script validates the public key against the store ID and rejects the development OAuth client. It never edits the unpacked development manifest. An existing archive is not overwritten.

Do not insert this public key into an existing user's unpacked development manifest: changing the extension ID creates a separate installation and separate browser-local storage. Prepare a separate store build instead. An explicit data-migration workflow is not implemented; export important notes before switching installations and retain the development installation if full local metadata is needed.

## Remaining release gates

1. The store-specific Chrome Extension OAuth client has been created; keep the development client intact. Review Google's separate testing/production project requirements before promotion beyond testing.
2. The isolated store package has been uploaded to the existing draft. Preserve this item ID for future updates and rerun validation when the configuration changes.
3. Publish the English homepage and privacy policy using GitHub Pages from the now-public source repository. Use the maintainer's chosen public support contact. Google requires domain ownership verification; a shared-host URL is not sufficient unless ownership can be verified.
4. Complete Google branding, audience, and applicable sensitive-scope verification. The project was still in Testing with one test user at the last check.
5. Validate Google login and saving with a real external account using the store identity. Check create/select, repeated appends and exports, failure recovery, and disconnect.
6. Supply store-sized screenshots and any required promotional assets. Complete privacy disclosures, distribution, and reviewer instructions accurately.
7. Confirm all dashboard requirements and submit for review only when ready. Draft creation and successful CI are not publication or approval.

## References

- [Chrome OAuth and consistent extension IDs](https://developer.chrome.com/docs/extensions/how-to/integrate/oauth)
- [Google Docs authorization scopes](https://developers.google.com/workspace/docs/api/auth)
- [Google OAuth production-readiness requirements](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance)
- [Chrome Web Store image requirements](https://developer.chrome.com/docs/webstore/images)
