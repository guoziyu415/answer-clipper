#!/bin/zsh

set -euo pipefail

SCRIPT_DIR="${0:A:h}"
PROJECT_DIR="${SCRIPT_DIR:h}"
SOURCE_APP="$PROJECT_DIR/build/Answer Clipper.app"
DIST_DIR="$PROJECT_DIR/dist"
VERSION="$(plutil -extract CFBundleShortVersionString raw -o - "$PROJECT_DIR/Resources/Info.plist")"
ARCHIVE="$DIST_DIR/Answer-Clipper-macOS-v$VERSION.zip"
SIGN_IDENTITY="${CODE_SIGN_IDENTITY:--}"
STAGING_DIR="$(mktemp -d "${TMPDIR:-/tmp}/answer-clipper-release.XXXXXX")"
STAGED_APP="$STAGING_DIR/Answer Clipper.app"
VERIFY_DIR="$STAGING_DIR/verify"

cleanup() {
    rm -rf "$STAGING_DIR"
}
trap cleanup EXIT

if [[ ! -d "$SOURCE_APP" ]]; then
    echo "Missing $SOURCE_APP. Run ./scripts/build-app.sh first." >&2
    exit 1
fi

mkdir -p "$DIST_DIR" "$VERIFY_DIR"
ditto "$SOURCE_APP" "$STAGED_APP"
xattr -cr "$STAGED_APP"
find "$STAGED_APP" -name '._*' -type f -delete
codesign --force --deep --sign "$SIGN_IDENTITY" "$STAGED_APP"
xattr -cr "$STAGED_APP"
codesign --verify --deep --strict --verbose=2 "$STAGED_APP"

rm -f "$ARCHIVE"
(cd "$STAGING_DIR" && zip -qry -X "$ARCHIVE" "Answer Clipper.app")
unzip -q "$ARCHIVE" -d "$VERIFY_DIR"
xattr -cr "$VERIFY_DIR/Answer Clipper.app"
codesign --verify --deep --strict --verbose=2 "$VERIFY_DIR/Answer Clipper.app"

echo "Created $ARCHIVE"
