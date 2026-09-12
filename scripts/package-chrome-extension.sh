#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EXTENSION_DIR="$ROOT_DIR/chrome-extension"
DIST_DIR="$ROOT_DIR/dist"
VERSION="$(sed -n 's/.*"version": "\([^"]*\)".*/\1/p' "$EXTENSION_DIR/manifest.json" | head -n 1)"
ARCHIVE="$DIST_DIR/Answer-Clipper-Chrome-v$VERSION.zip"

mkdir -p "$DIST_DIR"
rm -f "$ARCHIVE"

cd "$EXTENSION_DIR"
zip -qr "$ARCHIVE" \
  manifest.json background.js content.js options.html options.js settings.css \
  popup.html popup.js popup.css google-setup.html lib icons/icon-16.png icons/icon-32.png icons/icon-48.png icons/icon-128.png

echo "Created $ARCHIVE"
