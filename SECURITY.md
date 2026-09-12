# Security Policy

## Supported versions

Security fixes are applied to the latest release on the `main` branch.

## Reporting a vulnerability

Please do not publish sensitive vulnerability details in a public issue. Contact the maintainer privately through the GitHub account associated with this repository and include:

- The affected version and component
- Reproduction steps
- The expected and observed behavior
- The potential impact

Do not include private page content, conversations, or personal notes in a report. Use synthetic test data whenever possible.

## Security model

- The macOS app writes only to the selected Markdown destination.
- The Chrome extension always stores clips locally first. Optional Google Docs actions send data directly to Google's API after the user connects and chooses a cloud destination or export.
- Google tokens are managed by Chrome Identity, never returned to content scripts, and never stored in annotation records. Cloud connection and document-selection messages are accepted only from extension pages.
- The MCP app is a single-user, local development prototype. It is not approved for public hosting and does not provide OAuth or per-user isolation.
