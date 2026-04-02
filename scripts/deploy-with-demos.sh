#!/bin/bash
# =============================================================================
# Deploy Zorbit Unified Console + Demos to server
# CRITICAL: NO --delete flags anywhere
# =============================================================================

set -euo pipefail

LOCAL_DIR="/Users/s/workspace/zorbit/02_repos/zorbit-admin-console"
REMOTE="sovpn"
REMOTE_CONSOLE="/home/sourav/apps/zorbit-platform/admin-console"
REMOTE_DEMOS="/home/sourav/apps/zorbit-platform/demos"

echo "=== Step 1: Build ==="
cd "$LOCAL_DIR"
npm run build

echo ""
echo "=== Step 2: Deploy console (NO --delete) ==="
rsync -az dist/ "$REMOTE:$REMOTE_CONSOLE/"

echo ""
echo "=== Step 3: Create demos directory on server ==="
ssh "$REMOTE" "mkdir -p $REMOTE_DEMOS"

echo ""
echo "=== Step 4: Copy existing demos from console to separate dir ==="
ssh "$REMOTE" "cp -rn $REMOTE_CONSOLE/demos/* $REMOTE_DEMOS/ 2>/dev/null || true"

echo ""
echo "=== Step 5: Deploy local demos (NO --delete) ==="
rsync -az "$LOCAL_DIR/public/demos/" "$REMOTE:$REMOTE_DEMOS/"

echo ""
echo "=== Step 6: Deploy video generation script ==="
rsync -az "$LOCAL_DIR/scripts/video-gen/" "$REMOTE:$REMOTE_DEMOS/../scripts/video-gen/"

echo ""
echo "=== Done ==="
echo "Console: https://scalatics.com"
echo "Demos:   https://scalatics.com/demos/"
echo ""
echo "To generate narrated videos on the server:"
echo "  ssh sovpn 'bash /home/sourav/apps/zorbit-platform/scripts/video-gen/generate-narrated-videos.sh'"
echo ""
echo "To set up nginx /demos/ location:"
echo "  scp /tmp/nginx-demos-separate.py sovpn:/tmp/"
echo "  ssh sovpn 'sudo python3 /tmp/nginx-demos-separate.py && sudo nginx -t && sudo systemctl reload nginx'"
