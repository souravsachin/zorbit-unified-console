#!/bin/bash
# safe-rm: moves files/folders to .trash instead of deleting
# Usage: safe-rm <path1> <path2> ...
# Install: alias rm='bash /path/to/safe-rm.sh'

TRASH_DIR="$HOME/.trash"
mkdir -p "$TRASH_DIR"

if [ $# -eq 0 ]; then
  echo "Usage: safe-rm <path1> <path2> ..."
  exit 1
fi

# Skip flags (pass through -r, -f, -rf, etc.)
PATHS=()
for arg in "$@"; do
  if [[ "$arg" == -* ]]; then
    continue  # skip flags like -rf, -r, -f
  else
    PATHS+=("$arg")
  fi
done

if [ ${#PATHS[@]} -eq 0 ]; then
  echo "No paths specified"
  exit 1
fi

for item in "${PATHS[@]}"; do
  if [ ! -e "$item" ]; then
    echo "  SKIP: $item (not found)"
    continue
  fi

  # Create timestamped destination preserving structure
  BASENAME=$(basename "$item")
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  DEST="$TRASH_DIR/${BASENAME}__${TIMESTAMP}"

  mv "$item" "$DEST"
  echo "  TRASHED: $item → $DEST"
done
