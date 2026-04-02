#!/bin/bash
# Revert script for flat-route refactor
# Usage: bash scripts/revert-route-refactor.sh

set -e
cd "$(dirname "$0")/.."

echo "Restoring pre-route-refactor backup..."

if [ -d "dist-backup-pre-route-refactor" ]; then
  rm -rf dist/
  cp -a dist-backup-pre-route-refactor/ dist/
  echo "dist/ restored from backup."
else
  echo "ERROR: dist-backup-pre-route-refactor/ not found!"
  exit 1
fi

if [ -f "src/App.tsx.backup-pre-route-refactor" ]; then
  cp src/App.tsx.backup-pre-route-refactor src/App.tsx
  echo "App.tsx restored from backup."
fi

echo "Revert complete."
