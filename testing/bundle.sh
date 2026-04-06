#!/bin/bash
# Generate a portable E2E test bundle zip
# Usage: ./bundle.sh
# Output: zorbit-e2e-bundle-<timestamp>-<gitsha>.zip

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BUNDLE_SRC="$SCRIPT_DIR/e2e-standalone-bundle"

cd "$PROJECT_DIR"

# Build identifiers
SHA=$(git log --oneline -1 --format="%h" 2>/dev/null || echo "nogit")
TS=$(date +"%Y%m%d-%H%M")
FOLDER="zorbit-e2e-bundle-${TS}-${SHA}"
ZIPNAME="${FOLDER}.zip"
ZIPPATH="$SCRIPT_DIR/${ZIPNAME}"

echo "  Building: ${ZIPNAME}"
echo "  Source:   ${BUNDLE_SRC}"

# Create temp staging area
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

mkdir -p "$TMPDIR/$FOLDER"

# Copy bundle contents (exclude runtime artifacts)
rsync -a \
  --exclude='node_modules' \
  --exclude='outputs' \
  --exclude='.git' \
  --exclude='credentials/credentials.json' \
  "$BUNDLE_SRC/" "$TMPDIR/$FOLDER/"

# Use README-BUNDLE.md as the top-level README
if [ -f "$BUNDLE_SRC/README-BUNDLE.md" ]; then
  cp "$BUNDLE_SRC/README-BUNDLE.md" "$TMPDIR/$FOLDER/README.md"
fi

# Create zip
cd "$TMPDIR"
zip -rq "$ZIPPATH" "$FOLDER" -x "*.DS_Store"

SIZE=$(ls -lh "$ZIPPATH" | awk '{print $5}')
echo ""
echo "  Done: ${ZIPPATH}"
echo "  Size: ${SIZE}"
echo "  Folder inside zip: ${FOLDER}/"
echo ""
echo "  Transfer to developer:"
echo "    scp ${ZIPPATH} user@machine:~/"
echo ""
echo "  Developer runs:"
echo "    unzip ${ZIPNAME}"
echo "    cd ${FOLDER}"
echo "    cp credentials/credentials.example.json credentials/credentials.json"
echo "    # edit credentials.json with your login"
echo "    ./runme.sh smoke-test"
