#!/bin/bash
# Server cleanup script — run on sovpn
# Usage: ssh sovpn 'bash -s' < scripts/server-cleanup.sh

set -e  # Exit on any error

cd /home/sourav/apps/zorbit-platform

# Step 1: Rename folders
echo "Step 1: Renaming folders..."
mv jitsi-meet zorbit-tpm-jitsi_meet
mv sample-customer-service zorbit-app-sample_customer
echo "  Done: jitsi-meet → zorbit-tpm-jitsi_meet"
echo "  Done: sample-customer-service → zorbit-app-sample_customer"

# Step 2: Fix Jitsi docker-compose paths
echo "Step 2: Fixing Jitsi env..."
sed -i 's|jitsi-meet|zorbit-tpm-jitsi_meet|g' zorbit-tpm-jitsi_meet/.env
echo "  Done: .env updated"

# Step 3: Remove old PM2 processes
echo "Step 3: Removing old PM2 processes..."
source ~/.nvm/nvm.sh && nvm use 20 > /dev/null
pm2 delete zorbit-admin-console 2>/dev/null || true
pm2 delete sample-customer-service 2>/dev/null || true
echo "  Done: old processes removed"

# Step 4: Delete old folders
echo "Step 4: Deleting old folders..."
rm -rf admin-console admin-console-server demos-backup TO_BE_DELETED
echo "  Done: old folders deleted"

# Step 5: Save PM2 state
echo "Step 5: Saving PM2 state..."
pm2 save
echo "  Done: PM2 state saved"

echo ""
echo "=== Cleanup complete ==="
echo ""
echo "MANUAL STEP NEEDED (requires sudo):"
echo "  sudo sed -i \\"
echo "    's|/api/admin-console/|/api/unified-console/|g; s|admin-console deployments|unified-console deployments|g' \\"
echo "    /etc/nginx/sites-enabled/zorbit.scalatics.com && \\"
echo "  sudo nginx -t && \\"
echo "  sudo systemctl reload nginx"
