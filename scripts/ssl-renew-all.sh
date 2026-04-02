#!/bin/bash
# SSL Certificate Auto-Renewal via Route53 DNS
# Cron: 0 3 1 * * sudo bash /home/sourav/apps/zorbit-platform/scripts/ssl-renew-all.sh >> /var/log/ssl-renew.log 2>&1

echo "=== SSL Certificate Renewal — $(date) ==="

# Set AWS credentials for certbot
export AWS_CONFIG_FILE=/home/sourav/.aws/config
export AWS_SHARED_CREDENTIALS_FILE=/home/sourav/.aws/credentials

# Renew all domains using Route53 DNS challenge
DOMAINS=(
  "scalatics.com:*.scalatics.com,scalatics.com"
  "claimzippy.com-0001:*.claimzippy.com"
  "edrahi.com-0001:*.edrahi.com"
  "onezippy.ai:*.onezippy.ai"
  "jayna.ai:*.jayna.ai"
  "vitazoi.com:*.vitazoi.com,vitazoi.com"
)

FAILED=0
RENEWED=0

for entry in "${DOMAINS[@]}"; do
  IFS=':' read -r CERT_NAME DOMAIN_LIST <<< "$entry"
  D_FLAGS=""
  IFS=',' read -ra DOMS <<< "$DOMAIN_LIST"
  for d in "${DOMS[@]}"; do
    D_FLAGS="$D_FLAGS -d $d"
  done

  echo ""
  echo "--- Renewing: $CERT_NAME ($DOMAIN_LIST) ---"
  certbot certonly \
    --dns-route53 \
    --cert-name "$CERT_NAME" \
    $D_FLAGS \
    --non-interactive \
    --agree-tos \
    --email s@onezippy.ai \
    --keep-until-expiring \
    2>&1

  if [ $? -eq 0 ]; then
    echo "  OK: $CERT_NAME"
    RENEWED=$((RENEWED + 1))
  else
    echo "  FAILED: $CERT_NAME"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "--- Reloading nginx ---"
nginx -t && systemctl reload nginx
echo "=== Done: $RENEWED ok, $FAILED failed — $(date) ==="
