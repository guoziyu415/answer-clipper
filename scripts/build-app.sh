#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="${0:A:h}"
PROJECT_DIR="${SCRIPT_DIR:h}"
APP_DIR="$PROJECT_DIR/build/Answer Clipper.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
CLANG_CACHE_DIR="$PROJECT_DIR/.build/clang-module-cache"
SWIFTPM_CACHE_DIR="$PROJECT_DIR/.build/swiftpm-module-cache"

cd "$PROJECT_DIR"
mkdir -p "$CLANG_CACHE_DIR" "$SWIFTPM_CACHE_DIR"
env \
    CLANG_MODULE_CACHE_PATH="$CLANG_CACHE_DIR" \
    SWIFTPM_MODULECACHE_OVERRIDE="$SWIFTPM_CACHE_DIR" \
    swift build --disable-sandbox -c release

rm -rf "$APP_DIR"
mkdir -p "$MACOS_DIR"
cp "$PROJECT_DIR/.build/release/AnswerClipper" "$MACOS_DIR/AnswerClipper"
cp "$PROJECT_DIR/Resources/Info.plist" "$CONTENTS_DIR/Info.plist"

xattr -cr "$APP_DIR"
codesign --force --deep --sign - "$APP_DIR"
xattr -d com.apple.FinderInfo "$APP_DIR" 2>/dev/null || true
xattr -d 'com.apple.fileprovider.fpfs#P' "$APP_DIR" 2>/dev/null || true

echo "$APP_DIR"
