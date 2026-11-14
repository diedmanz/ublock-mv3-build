#!/usr/bin/env bash
#
# build.sh — build uBlock Origin Lite (MV3) with this repo's custom scriptlets.
#
# The upstream uBlock source is NOT kept in this repo. This script clones
# gorhill/uBlock at a pinned commit, applies this repo's overlay on top of it
# (custom scriptlets + patches), and builds the extension.
#
# Usage:
#   bash build.sh [target-dir]          # default target: ./uBOLite_adhider
#
# Environment overrides:
#   UBO_REPO    upstream repo URL       (default: https://github.com/gorhill/uBlock)
#   UBO_REF     upstream commit to build (default: the pinned commit below)
#   UBOL_WORK   work dir for the clone  (default: ./.build)
#
# Requirements: git, node, jq, patch, python.
# On Windows use Git Bash — the build script itself is the Windows-safe one
# (cygpath fixes included).
#
set -euo pipefail

UBO_REPO="${UBO_REPO:-https://github.com/gorhill/uBlock}"
UBO_REF="${UBO_REF:-0ab2e114fb6e0b0e6ce21d45451b9f39cafaec22}"

# All paths are kept in native Windows form ("C:/Users/...") from here on.
# Reason: on this box MSYS path conversion is DISABLED, so a POSIX path
# handed to a native program (git, node, jq, python) is resolved against the
# current drive and lands in "C:\c\Users\...". cygpath -m gives a path both
# worlds understand.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cygpath -m "$REPO_ROOT")"

# Resolve a path to a native absolute one (relative paths -> relative to repo).
abs_path() {
    case "$1" in
        /*|[A-Za-z]:*) cygpath -m "$1" ;;
        *)            cygpath -m "$REPO_ROOT/$1" ;;
    esac
}

WORK_DIR="$(abs_path "${UBOL_WORK:-.build}")"
TARGET_DIR="$(abs_path "${1:-uBOLite_adhider}")"
UB_DIR="$WORK_DIR/uBlock"
BUILD_DIR="$UB_DIR/dist/build/uBOLite.chromium"

step() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
die()  { printf '\n[ERROR] %s\n' "$*" >&2; exit 1; }

# Never let a stray target path clobber an extension that Chrome has loaded.
case "$(printf '%s' "$TARGET_DIR" | tr 'A-Z' 'a-z')" in
    *"/projects/ubolite.chromium") die "refusing to overwrite $TARGET_DIR (that folder is loaded in Chrome); pass a different target" ;;
esac

for tool in git node jq patch python; do
    command -v "$tool" >/dev/null 2>&1 || die "missing required tool: $tool"
done

step "Upstream source: $UBO_REPO @ ${UBO_REF:0:12}"
mkdir -p "$WORK_DIR"
if [ ! -d "$UB_DIR/.git" ]; then
    echo "--- cloning (partial, no checkout)"
    git clone --filter=blob:none --no-checkout "$UBO_REPO" "$UB_DIR"
fi
echo "--- fetching pinned commit"
if ! git -C "$UB_DIR" fetch --depth 1 origin "$UBO_REF" 2>/dev/null; then
    echo "    (fetch by SHA refused, falling back to a full fetch)"
    git -C "$UB_DIR" fetch origin
fi
git -C "$UB_DIR" checkout --detach "$UBO_REF"
echo "--- initializing submodules (codemirror / s14e-serializer)"
git -C "$UB_DIR" submodule update --init --recursive

step "Applying overlay"
# 1. Windows-safe build script (cygpath fixes for node/jq under MSYS).
cp "$REPO_ROOT/src/make-mv3.windows-patched.sh" "$UB_DIR/tools/make-mv3.sh"
# 2. Custom scriptlets into the source tree.
cp "$REPO_ROOT/src/custom-scriptlets/"*.js "$UB_DIR/src/js/resources/"
# 3. Import the custom scriptlets from uBO's scriptlet registry.
patch -p1 -d "$UB_DIR/src" < "$REPO_ROOT/src/patches/scriptlets.js.patch"

step "Building uBOLite (chromium)"
cd "$UB_DIR"
bash tools/make-mv3.sh chromium
[ -d "$BUILD_DIR" ] || die "build produced no output at $BUILD_DIR"

step "Post-build"
# 4. Re-register user scripts on session start (needed for --load-extension
#    launches, where onInstalled never fires).
patch --forward -p1 -d "$BUILD_DIR" < "$REPO_ROOT/src/patches/background.js.patch" \
    || echo "    (background.js patch skipped)"
# 5. The register.html kick page used by the portable launcher.
cp "$REPO_ROOT/src/custom-ui/register.html" "$REPO_ROOT/src/custom-ui/register.js" "$BUILD_DIR/"
# 6. Thai ad-network rules.
python "$REPO_ROOT/patch-rulesets.py" "$BUILD_DIR"

step "Publishing to $TARGET_DIR"
if [ -e "$TARGET_DIR" ]; then
    die "$TARGET_DIR already exists — remove it or pass another target"
fi
mkdir -p "$TARGET_DIR"
cp -R "$BUILD_DIR/." "$TARGET_DIR/"

step "Verifying the artifact"
VERSION="$(jq -r .version "$TARGET_DIR/manifest.json")"
RULE_SETS="$(jq '.declarative_net_request.rule_resources | length' "$TARGET_DIR/manifest.json")"
RULES=0
for f in "$TARGET_DIR"/rulesets/main/*.json; do
    n="$(jq 'length' "$f" 2>/dev/null || echo 0)"
    RULES=$(( RULES + n ))
done
printf 'version              : %s\n' "$VERSION"
printf 'rule_resources       : %s\n' "$RULE_SETS"
printf 'rules across rulesets: %s\n' "$RULES"
printf 'custom scriptlets    : %s\n' "$(ls "$TARGET_DIR/js/resources/" | grep -c -E 'ad-hider|ad-gate-skip|twitch-videoad')"
printf 'register.html        : %s\n' "$([ -f "$TARGET_DIR/register.html" ] && echo yes || echo NO)"
printf 'thai ad rules        : %s\n' "$(grep -c 'adsok.co' "$TARGET_DIR/rulesets/main/ublock-filters.json" || true)"
printf 'files / size         : %s / %s\n' \
    "$(find "$TARGET_DIR" -type f | wc -l)" "$(du -sh "$TARGET_DIR" | cut -f1)"

if [ "$RULES" -lt 1000 ]; then
    die "only $RULES rules in the build — this is the known MSYS path trap, the build is broken"
fi

printf '\n\033[1mBUILD OK\033[0m -> %s\n' "$TARGET_DIR"
printf 'Load it with: chrome://extensions -> Developer mode -> Load unpacked -> pick that folder\n'
printf 'Then enable "Allow user scripts" in the extension Details page.\n'
