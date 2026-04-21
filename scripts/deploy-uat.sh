#!/bin/bash
#
# Zorbit Platform — UAT Deployment Script
# Target: 141.145.155.34 (zorbit-uat.onezippy.ai)
#
# Run this from the build machine (your laptop):
#   bash scripts/deploy-uat.sh
#
# Prerequisites on target server (run as sudo):
#   - Node.js 20, PM2, MongoDB, PostgreSQL, Docker, Nginx installed
#   - /opt/zorbit-platform directory created
#
set -e

UAT_HOST="${UAT_HOST:-ilri-arm-uat}"
UAT_DIR="/opt/zorbit-platform"
LOCAL_BASE="/Users/s/workspace/zorbit/02_repos"
JWT_SECRET="$(openssl rand -hex 32)"
DB_PASSWORD="zorbit_uat_$(openssl rand -hex 8)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "============================================================"
echo "  Zorbit Platform — UAT Deployment"
echo "  Target: $UAT_HOST ($UAT_DIR)"
echo "============================================================"
echo ""

# ─── Services to deploy ───
SERVICES=(
  "zorbit-identity:3001:postgresql"
  "zorbit-authorization:3002:postgresql"
  "zorbit-navigation:3003:postgresql"
  "zorbit-event_bus:3004:none"
  "zorbit-pii-vault:3005:postgresql"
  "zorbit-audit:3006:postgresql"
  "zorbit-pfs-product_pricing:3025:mongodb"
  "zorbit-pfs-form_builder:3014:mongodb"
  "zorbit-pfs-doc_generator:3026:mongodb"
  "zorbit-app-pcg4:3011:mongodb"
  "zorbit-app-hi_quotation:3017:mongodb"
  "zorbit-app-uw_workflow:3015:mongodb"
  "zorbit-app-hi_uw_decisioning:3016:mongodb"
)

FRONTEND="zorbit-unified-console"

# ─── Step 1: Build all services locally ───
echo -e "${GREEN}[1/6] Building all services...${NC}"
for SVC_INFO in "${SERVICES[@]}"; do
  SVC=$(echo "$SVC_INFO" | cut -d: -f1)
  if [ -d "$LOCAL_BASE/$SVC" ]; then
    echo "  Building $SVC..."
    cd "$LOCAL_BASE/$SVC"
    npm run build 2>/dev/null || echo "  WARNING: $SVC build had issues"
  fi
done

# Build frontend
echo "  Building $FRONTEND..."
cd "$LOCAL_BASE/$FRONTEND"
npx vite build 2>/dev/null

echo -e "${GREEN}  All builds complete${NC}"

# ─── Step 2: Create deployment package ───
echo ""
echo -e "${GREEN}[2/6] Creating deployment package...${NC}"
DEPLOY_DIR="/tmp/zorbit-deploy-$(date +%Y%m%d)"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/services" "$DEPLOY_DIR/frontend" "$DEPLOY_DIR/scripts"

for SVC_INFO in "${SERVICES[@]}"; do
  SVC=$(echo "$SVC_INFO" | cut -d: -f1)
  PORT=$(echo "$SVC_INFO" | cut -d: -f2)
  DB=$(echo "$SVC_INFO" | cut -d: -f3)

  if [ -d "$LOCAL_BASE/$SVC/dist" ]; then
    SVC_DEPLOY="$DEPLOY_DIR/services/$SVC"
    mkdir -p "$SVC_DEPLOY"
    cp -r "$LOCAL_BASE/$SVC/dist" "$SVC_DEPLOY/"
    cp "$LOCAL_BASE/$SVC/package.json" "$SVC_DEPLOY/" 2>/dev/null
    cp "$LOCAL_BASE/$SVC/package-lock.json" "$SVC_DEPLOY/" 2>/dev/null
    [ -f "$LOCAL_BASE/$SVC/.env.example" ] && cp "$LOCAL_BASE/$SVC/.env.example" "$SVC_DEPLOY/"
    # Copy templates if they exist
    [ -d "$LOCAL_BASE/$SVC/src/templates" ] && cp -r "$LOCAL_BASE/$SVC/src/templates" "$SVC_DEPLOY/dist/"
    # Copy seeds
    [ -d "$LOCAL_BASE/$SVC/dist/seeds" ] && cp -r "$LOCAL_BASE/$SVC/dist/seeds" "$SVC_DEPLOY/seeds/"
    echo "  Packed $SVC (port $PORT, db: $DB)"
  fi
done

# Frontend
cp -r "$LOCAL_BASE/$FRONTEND/dist" "$DEPLOY_DIR/frontend/"
echo "  Packed frontend"

# ─── Step 3: Generate PM2 ecosystem config ───
echo ""
echo -e "${GREEN}[3/6] Generating PM2 config...${NC}"
cat > "$DEPLOY_DIR/scripts/ecosystem.config.js" << 'PMEOF'
module.exports = {
  apps: [
PMEOF

for SVC_INFO in "${SERVICES[@]}"; do
  SVC=$(echo "$SVC_INFO" | cut -d: -f1)
  PORT=$(echo "$SVC_INFO" | cut -d: -f2)
  cat >> "$DEPLOY_DIR/scripts/ecosystem.config.js" << SVCEOF
    {
      name: "$SVC",
      script: "dist/main.js",
      cwd: "$UAT_DIR/services/$SVC",
      env: { NODE_ENV: "production", PORT: $PORT }
    },
SVCEOF
done

cat >> "$DEPLOY_DIR/scripts/ecosystem.config.js" << 'PMEOF'
  ]
};
PMEOF
echo "  Generated ecosystem.config.js"

# ─── Step 4: Generate .env files ───
cat > "$DEPLOY_DIR/scripts/setup-env.sh" << ENVEOF
#!/bin/bash
# Auto-generated env setup for UAT
JWT_SECRET="$JWT_SECRET"
DB_PASSWORD="$DB_PASSWORD"

for SVC_DIR in $UAT_DIR/services/zorbit-identity $UAT_DIR/services/zorbit-authorization $UAT_DIR/services/zorbit-navigation $UAT_DIR/services/zorbit-pii-vault $UAT_DIR/services/zorbit-audit; do
  SVC=\$(basename \$SVC_DIR)
  DB_NAME="zorbit_\$(echo \$SVC | sed 's/zorbit-//')"
  PORT=\$(grep "\$SVC" $UAT_DIR/scripts/ecosystem.config.js | grep PORT | head -1 | grep -o '[0-9]*')
  cat > "\$SVC_DIR/.env" << EOF
PORT=\$PORT
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=\$DB_NAME
DATABASE_USER=zorbit
DATABASE_PASSWORD=\$DB_PASSWORD
DATABASE_SYNCHRONIZE=true
JWT_SECRET=\$JWT_SECRET
KAFKA_BROKERS=localhost:9092
CORS_ORIGINS=https://zorbit-uat.onezippy.ai,http://localhost:3000
EOF
done

for SVC_DIR in $UAT_DIR/services/zorbit-pfs-* $UAT_DIR/services/zorbit-app-*; do
  SVC=\$(basename \$SVC_DIR)
  DB_NAME="zorbit_\$(echo \$SVC | sed 's/zorbit-//' | tr '-' '_')"
  PORT=\$(grep "\$SVC" $UAT_DIR/scripts/ecosystem.config.js | grep PORT | head -1 | grep -o '[0-9]*')
  cat > "\$SVC_DIR/.env" << EOF
PORT=\$PORT
MONGO_URI=mongodb://127.0.0.1:27017/\$DB_NAME
JWT_SECRET=\$JWT_SECRET
KAFKA_BROKERS=localhost:9092
CORS_ORIGINS=https://zorbit-uat.onezippy.ai,http://localhost:3000
PII_VAULT_URL=http://localhost:3005
PRODUCT_PRICING_URL=http://localhost:3025
UW_WORKFLOW_URL=http://localhost:3015
AUTHORIZATION_URL=http://localhost:3002
EOF
done
ENVEOF
chmod +x "$DEPLOY_DIR/scripts/setup-env.sh"

# ─── Step 5: Generate install + start script ───
cat > "$DEPLOY_DIR/scripts/install-and-start.sh" << 'STARTEOF'
#!/bin/bash
set -e
cd /opt/zorbit-platform

echo "=== Installing dependencies ==="
for SVC_DIR in services/*/; do
  echo "  Installing $(basename $SVC_DIR)..."
  cd "/opt/zorbit-platform/$SVC_DIR"
  npm install --omit=dev --loglevel=error 2>/dev/null || echo "  (npm install had warnings)"
  cd /opt/zorbit-platform
done

echo ""
echo "=== Setting up environment ==="
bash scripts/setup-env.sh

echo ""
echo "=== Starting Kafka ==="
docker run -d --name zorbit-kafka --restart always \
  -p 9092:9092 \
  -e KAFKA_CFG_NODE_ID=0 \
  -e KAFKA_CFG_PROCESS_ROLES=controller,broker \
  -e KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093 \
  -e KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT \
  -e KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@localhost:9093 \
  -e KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER \
  bitnami/kafka:3.7 2>/dev/null || echo "Kafka already running"

echo ""
echo "=== Starting all services ==="
pm2 start scripts/ecosystem.config.js
pm2 save

echo ""
echo "=== Done ==="
pm2 list
STARTEOF
chmod +x "$DEPLOY_DIR/scripts/install-and-start.sh"

echo "  Generated setup scripts"

# ─── Step 6: Upload to server ───
echo ""
echo -e "${GREEN}[4/6] Uploading to $UAT_HOST...${NC}"
rsync -az --progress "$DEPLOY_DIR/" "$UAT_HOST:$UAT_DIR/"

echo ""
echo -e "${GREEN}[5/6] Uploading frontend...${NC}"
rsync -az "$DEPLOY_DIR/frontend/" "$UAT_HOST:$UAT_DIR/frontend/"

echo ""
echo "============================================================"
echo -e "${GREEN}  Deployment package uploaded to $UAT_HOST:$UAT_DIR${NC}"
echo ""
echo "  To complete setup, SSH into the server and run:"
echo ""
echo "    ssh $UAT_HOST"
echo "    cd $UAT_DIR"
echo "    bash scripts/install-and-start.sh"
echo ""
echo "  Then configure nginx (requires sudo):"
echo "    sudo cp scripts/nginx-zorbit-uat.conf /etc/nginx/sites-available/zorbit-uat"
echo "    sudo ln -sf /etc/nginx/sites-available/zorbit-uat /etc/nginx/sites-enabled/"
echo "    sudo nginx -t && sudo nginx -s reload"
echo "============================================================"
