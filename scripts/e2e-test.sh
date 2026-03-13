#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# Zorbit Platform — E2E Integration Test Suite
# Run on server: ssh sovpn 'bash -s' < scripts/e2e-test.sh
# Or directly:   ssh sovpn && bash /path/to/e2e-test.sh
###############################################################################

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BASE="http://localhost"
IDENTITY_URL="${BASE}:3099"
AUTHZ_URL="${BASE}:3102"
NAV_URL="${BASE}:3103"
MSG_URL="${BASE}:3104"
PII_URL="${BASE}:3105"
AUDIT_URL="${BASE}:3106"
CUSTOMER_URL="${BASE}:3110"

ORG_ID="O-DEMO"
TEST_EMAIL="e2e-$(date +%s)@zorbit.dev"
TEST_PASSWORD="E2eTest@2026"
TEST_DISPLAY_NAME="E2E Test User"

CURL_OPTS="-s --max-time 10"

# ---------------------------------------------------------------------------
# Colours & counters
# ---------------------------------------------------------------------------
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
CYAN="\033[0;36m"
BOLD="\033[1m"
RESET="\033[0m"

PASSED=0
FAILED=0
TOTAL=0

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
pass() {
  PASSED=$((PASSED + 1))
  TOTAL=$((TOTAL + 1))
  printf "${GREEN}  [PASS]${RESET} %s\n" "$1"
}

fail() {
  FAILED=$((FAILED + 1))
  TOTAL=$((TOTAL + 1))
  printf "${RED}  [FAIL]${RESET} %s\n" "$1"
  if [[ -n "${2:-}" ]]; then
    printf "${RED}         %s${RESET}\n" "$2"
  fi
}

section() {
  echo ""
  printf "${CYAN}${BOLD}── %s ──${RESET}\n" "$1"
}

# Check HTTP status code of a response.
# Usage: check_status "$response" expected_code test_label
# The response must be captured with -w '\n%{http_code}' so the last line is
# the status code.
check_status() {
  local body="$1"
  local expected="$2"
  local label="$3"
  local status
  status=$(echo "$body" | tail -n1)
  if [[ "$status" == "$expected" ]]; then
    pass "$label (HTTP $status)"
  else
    fail "$label (expected HTTP $expected, got HTTP $status)" "$(echo "$body" | sed '$d' | head -5)"
  fi
}

# ---------------------------------------------------------------------------
# Store state across tests
# ---------------------------------------------------------------------------
ACCESS_TOKEN=""
REFRESH_TOKEN=""
USER_ID=""
CUSTOMER_ID=""

###############################################################################
# 1. Health checks
###############################################################################
section "Health Checks"

health_check() {
  local name="$1"
  local url="$2"
  local resp
  resp=$(curl $CURL_OPTS -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  if [[ "$resp" =~ ^2[0-9][0-9]$ ]]; then
    pass "$name is up (HTTP $resp)"
  else
    fail "$name is down (HTTP $resp)" "$url"
  fi
}

# All services now have /api/v1/G/health (except messaging which has /api/v1/G/messaging/health)
health_check "Identity"      "${IDENTITY_URL}/api/v1/G/health"
health_check "Authorization" "${AUTHZ_URL}/api/v1/G/health"
health_check "Navigation"    "${NAV_URL}/api/v1/G/health"
health_check "Messaging"     "${MSG_URL}/api/v1/G/messaging/health"
health_check "PII Vault"     "${PII_URL}/api/v1/G/health"
health_check "Audit"         "${AUDIT_URL}/api/v1/G/health"
health_check "Customer"      "${CUSTOMER_URL}/api/v1/G/health"

###############################################################################
# 2. Register user
###############################################################################
section "User Registration"

REGISTER_RESP=$(curl $CURL_OPTS -w '\n%{http_code}' \
  -X POST "${IDENTITY_URL}/api/v1/G/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"displayName\": \"${TEST_DISPLAY_NAME}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"organizationId\": \"${ORG_ID}\"
  }" 2>/dev/null || echo -e "\n000")

REGISTER_STATUS=$(echo "$REGISTER_RESP" | tail -n1)
REGISTER_BODY=$(echo "$REGISTER_RESP" | sed '$d')

if [[ "$REGISTER_STATUS" =~ ^2[0-9][0-9]$ ]]; then
  pass "Register user (HTTP $REGISTER_STATUS)"

  # Extract tokens from registration response
  REG_ACCESS=$(echo "$REGISTER_BODY" | jq -r '.tokens.accessToken // .accessToken // empty' 2>/dev/null)
  REG_REFRESH=$(echo "$REGISTER_BODY" | jq -r '.tokens.refreshToken // .refreshToken // empty' 2>/dev/null)
  REG_USER_ID=$(echo "$REGISTER_BODY" | jq -r '.user.hashId // .user.id // .user.userId // .userId // .hashId // empty' 2>/dev/null)

  if [[ -n "$REG_ACCESS" ]]; then
    pass "Registration returned access token"
    ACCESS_TOKEN="$REG_ACCESS"
  else
    fail "Registration did not return access token"
  fi

  if [[ -n "$REG_REFRESH" ]]; then
    pass "Registration returned refresh token"
    REFRESH_TOKEN="$REG_REFRESH"
  else
    fail "Registration did not return refresh token"
  fi

  if [[ -n "$REG_USER_ID" ]]; then
    pass "Registration returned user ID: $REG_USER_ID"
    USER_ID="$REG_USER_ID"
  else
    fail "Registration did not return user ID"
  fi
else
  fail "Register user (HTTP $REGISTER_STATUS)" "$(echo "$REGISTER_BODY" | head -5)"
fi

###############################################################################
# 3. Login
###############################################################################
section "User Login"

LOGIN_RESP=$(curl $CURL_OPTS -w '\n%{http_code}' \
  -X POST "${IDENTITY_URL}/api/v1/G/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\"
  }" 2>/dev/null || echo -e "\n000")

LOGIN_STATUS=$(echo "$LOGIN_RESP" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESP" | sed '$d')

if [[ "$LOGIN_STATUS" =~ ^2[0-9][0-9]$ ]]; then
  pass "Login (HTTP $LOGIN_STATUS)"

  LOGIN_ACCESS=$(echo "$LOGIN_BODY" | jq -r '.accessToken // .tokens.accessToken // empty' 2>/dev/null)
  LOGIN_REFRESH=$(echo "$LOGIN_BODY" | jq -r '.refreshToken // .tokens.refreshToken // empty' 2>/dev/null)
  LOGIN_EXPIRES=$(echo "$LOGIN_BODY" | jq -r '.expiresIn // empty' 2>/dev/null)

  if [[ -n "$LOGIN_ACCESS" ]]; then
    pass "Login returned access token"
    ACCESS_TOKEN="$LOGIN_ACCESS"
  else
    fail "Login did not return access token"
  fi

  if [[ -n "$LOGIN_REFRESH" ]]; then
    pass "Login returned refresh token"
    REFRESH_TOKEN="$LOGIN_REFRESH"
  else
    fail "Login did not return refresh token"
  fi

  if [[ -n "$LOGIN_EXPIRES" ]]; then
    pass "Login returned expiresIn: $LOGIN_EXPIRES"
  else
    fail "Login did not return expiresIn"
  fi
else
  fail "Login (HTTP $LOGIN_STATUS)" "$(echo "$LOGIN_BODY" | head -5)"
fi

###############################################################################
# 4. Create customer
###############################################################################
section "Create Customer"

if [[ -z "$ACCESS_TOKEN" ]]; then
  fail "Skipping — no access token available"
else
  CUST_RESP=$(curl $CURL_OPTS -w '\n%{http_code}' \
    -X POST "${CUSTOMER_URL}/api/v1/O/${ORG_ID}/customers" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -d "{
      \"displayName\": \"E2E Customer $(date +%s)\",
      \"email\": \"cust-$(date +%s)@zorbit.dev\",
      \"phone\": \"+1-555-0199\"
    }" 2>/dev/null || echo -e "\n000")

  CUST_STATUS=$(echo "$CUST_RESP" | tail -n1)
  CUST_BODY=$(echo "$CUST_RESP" | sed '$d')

  if [[ "$CUST_STATUS" =~ ^2[0-9][0-9]$ ]]; then
    pass "Create customer (HTTP $CUST_STATUS)"

    CUSTOMER_ID=$(echo "$CUST_BODY" | jq -r '.hashId // .id // .customerId // empty' 2>/dev/null)
    if [[ -n "$CUSTOMER_ID" ]]; then
      pass "Customer created with ID: $CUSTOMER_ID"
    else
      fail "Customer response did not include an ID"
    fi
  else
    fail "Create customer (HTTP $CUST_STATUS)" "$(echo "$CUST_BODY" | head -5)"
  fi
fi

###############################################################################
# 5. List customers
###############################################################################
section "List Customers"

if [[ -z "$ACCESS_TOKEN" ]]; then
  fail "Skipping — no access token available"
else
  LIST_RESP=$(curl $CURL_OPTS -w '\n%{http_code}' \
    -X GET "${CUSTOMER_URL}/api/v1/O/${ORG_ID}/customers" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    2>/dev/null || echo -e "\n000")

  LIST_STATUS=$(echo "$LIST_RESP" | tail -n1)
  LIST_BODY=$(echo "$LIST_RESP" | sed '$d')

  if [[ "$LIST_STATUS" =~ ^2[0-9][0-9]$ ]]; then
    pass "List customers (HTTP $LIST_STATUS)"

    CUST_COUNT=$(echo "$LIST_BODY" | jq 'if type == "array" then length elif .data then (.data | length) elif .items then (.items | length) else 0 end' 2>/dev/null || echo "0")
    if [[ "$CUST_COUNT" -gt 0 ]]; then
      pass "Customer list contains $CUST_COUNT record(s)"
    else
      fail "Customer list is empty (expected at least 1)"
    fi
  else
    fail "List customers (HTTP $LIST_STATUS)" "$(echo "$LIST_BODY" | head -5)"
  fi
fi

###############################################################################
# 6. Check audit logs
###############################################################################
section "Audit Logs"

if [[ -z "$ACCESS_TOKEN" ]]; then
  fail "Skipping — no access token available"
else
  AUDIT_RESP=$(curl $CURL_OPTS -w '\n%{http_code}' \
    -X GET "${AUDIT_URL}/api/v1/O/${ORG_ID}/audit/logs" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    2>/dev/null || echo -e "\n000")

  AUDIT_STATUS=$(echo "$AUDIT_RESP" | tail -n1)
  AUDIT_BODY=$(echo "$AUDIT_RESP" | sed '$d')

  if [[ "$AUDIT_STATUS" =~ ^2[0-9][0-9]$ ]]; then
    pass "Fetch audit logs (HTTP $AUDIT_STATUS)"

    AUDIT_COUNT=$(echo "$AUDIT_BODY" | jq 'if type == "array" then length elif .data then (.data | length) elif .logs then (.logs | length) elif .items then (.items | length) else 0 end' 2>/dev/null || echo "0")
    if [[ "$AUDIT_COUNT" -gt 0 ]]; then
      pass "Audit log contains $AUDIT_COUNT entry/entries"
    else
      # Audit entries may arrive asynchronously; warn instead of hard-fail
      printf "${YELLOW}  [WARN]${RESET} Audit log is empty (events may still be in transit)\n"
    fi
  else
    fail "Fetch audit logs (HTTP $AUDIT_STATUS)" "$(echo "$AUDIT_BODY" | head -5)"
  fi
fi

###############################################################################
# 7. Create role (Authorization service)
###############################################################################
section "Create Role"

if [[ -z "$ACCESS_TOKEN" ]]; then
  fail "Skipping — no access token available"
else
  ROLE_NAME="e2e-role-$(date +%s)"
  ROLE_RESP=$(curl $CURL_OPTS -w '\n%{http_code}' \
    -X POST "${AUTHZ_URL}/api/v1/O/${ORG_ID}/roles" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -d "{
      \"name\": \"${ROLE_NAME}\",
      \"description\": \"Role created by E2E test\"
    }" 2>/dev/null || echo -e "\n000")

  ROLE_STATUS=$(echo "$ROLE_RESP" | tail -n1)
  ROLE_BODY=$(echo "$ROLE_RESP" | sed '$d')

  if [[ "$ROLE_STATUS" =~ ^2[0-9][0-9]$ ]]; then
    pass "Create role (HTTP $ROLE_STATUS)"

    ROLE_ID=$(echo "$ROLE_BODY" | jq -r '.hashId // .id // .roleId // empty' 2>/dev/null)
    if [[ -n "$ROLE_ID" ]]; then
      pass "Role created with ID: $ROLE_ID"
    else
      fail "Role response did not include an ID"
    fi
  else
    fail "Create role (HTTP $ROLE_STATUS)" "$(echo "$ROLE_BODY" | head -5)"
  fi
fi

###############################################################################
# 8. Messaging health
###############################################################################
section "Messaging Health"

MSG_RESP=$(curl $CURL_OPTS -w '\n%{http_code}' \
  -X GET "${MSG_URL}/api/v1/G/messaging/health" \
  2>/dev/null || echo -e "\n000")

MSG_STATUS=$(echo "$MSG_RESP" | tail -n1)
MSG_BODY=$(echo "$MSG_RESP" | sed '$d')

if [[ "$MSG_STATUS" =~ ^2[0-9][0-9]$ ]]; then
  pass "Messaging health endpoint (HTTP $MSG_STATUS)"
else
  fail "Messaging health endpoint (HTTP $MSG_STATUS)" "$(echo "$MSG_BODY" | head -5)"
fi

###############################################################################
# 9. Auth providers
###############################################################################
section "Auth Providers"

PROV_RESP=$(curl $CURL_OPTS -w '\n%{http_code}' \
  -X GET "${IDENTITY_URL}/api/v1/G/auth/providers" \
  2>/dev/null || echo -e "\n000")

PROV_STATUS=$(echo "$PROV_RESP" | tail -n1)
PROV_BODY=$(echo "$PROV_RESP" | sed '$d')

if [[ "$PROV_STATUS" =~ ^2[0-9][0-9]$ ]]; then
  pass "Auth providers endpoint (HTTP $PROV_STATUS)"

  PROV_COUNT=$(echo "$PROV_BODY" | jq 'if type == "array" then length elif .providers then (.providers | length) elif .data then (.data | length) else 0 end' 2>/dev/null || echo "0")
  if [[ "$PROV_COUNT" -gt 0 ]]; then
    pass "Providers list contains $PROV_COUNT provider(s)"
  else
    printf "${YELLOW}  [WARN]${RESET} Providers list is empty or format unknown\n"
  fi
else
  fail "Auth providers endpoint (HTTP $PROV_STATUS)" "$(echo "$PROV_BODY" | head -5)"
fi

###############################################################################
# 10. RADIUS authentication
###############################################################################
section "RADIUS Authentication"

RADIUS_RESP=$(curl $CURL_OPTS -w '\n%{http_code}' \
  -X POST "${IDENTITY_URL}/api/v1/G/auth/radius" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"testuser\",
    \"password\": \"testpass\"
  }" 2>/dev/null || echo -e "\n000")

RADIUS_STATUS=$(echo "$RADIUS_RESP" | tail -n1)
RADIUS_BODY=$(echo "$RADIUS_RESP" | sed '$d')

if [[ "$RADIUS_STATUS" =~ ^2[0-9][0-9]$ ]]; then
  pass "RADIUS login (HTTP $RADIUS_STATUS)"

  RADIUS_TOKEN=$(echo "$RADIUS_BODY" | jq -r '.accessToken // empty' 2>/dev/null)
  if [[ -n "$RADIUS_TOKEN" ]]; then
    pass "RADIUS returned access token"
  else
    fail "RADIUS did not return access token"
  fi

  RADIUS_USER=$(echo "$RADIUS_BODY" | jq -r '.user.username // empty' 2>/dev/null)
  if [[ -n "$RADIUS_USER" ]]; then
    pass "RADIUS returned username: $RADIUS_USER"
  else
    fail "RADIUS did not return username"
  fi
else
  fail "RADIUS login (HTTP $RADIUS_STATUS)" "$(echo "$RADIUS_BODY" | head -5)"
fi

# Test RADIUS with bad credentials
RADIUS_BAD=$(curl $CURL_OPTS -o /dev/null -w "%{http_code}" \
  -X POST "${IDENTITY_URL}/api/v1/G/auth/radius" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser\",\"password\":\"wrongpass\"}" 2>/dev/null || echo "000")

if [[ "$RADIUS_BAD" == "401" ]]; then
  pass "RADIUS rejects bad credentials (HTTP $RADIUS_BAD)"
else
  fail "RADIUS bad-creds test (expected 401, got HTTP $RADIUS_BAD)"
fi

###############################################################################
# 11. Diameter authentication
###############################################################################
section "Diameter Authentication"

DIAM_RESP=$(curl $CURL_OPTS -w '\n%{http_code}' \
  -X POST "${IDENTITY_URL}/api/v1/G/auth/diameter" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"testuser@scalatics.com\",
    \"password\": \"testpass\"
  }" 2>/dev/null || echo -e "\n000")

DIAM_STATUS=$(echo "$DIAM_RESP" | tail -n1)
DIAM_BODY=$(echo "$DIAM_RESP" | sed '$d')

if [[ "$DIAM_STATUS" =~ ^2[0-9][0-9]$ ]]; then
  pass "Diameter login (HTTP $DIAM_STATUS)"

  DIAM_TOKEN=$(echo "$DIAM_BODY" | jq -r '.accessToken // empty' 2>/dev/null)
  if [[ -n "$DIAM_TOKEN" ]]; then
    pass "Diameter returned access token"
  else
    fail "Diameter did not return access token"
  fi

  DIAM_USER=$(echo "$DIAM_BODY" | jq -r '.user.username // empty' 2>/dev/null)
  if [[ -n "$DIAM_USER" ]]; then
    pass "Diameter returned username: $DIAM_USER"
  else
    fail "Diameter did not return username"
  fi
else
  fail "Diameter login (HTTP $DIAM_STATUS)" "$(echo "$DIAM_BODY" | head -5)"
fi

# Test Diameter with bad credentials
DIAM_BAD=$(curl $CURL_OPTS -o /dev/null -w "%{http_code}" \
  -X POST "${IDENTITY_URL}/api/v1/G/auth/diameter" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser@scalatics.com\",\"password\":\"wrongpass\"}" 2>/dev/null || echo "000")

if [[ "$DIAM_BAD" == "401" ]]; then
  pass "Diameter rejects bad credentials (HTTP $DIAM_BAD)"
else
  fail "Diameter bad-creds test (expected 401, got HTTP $DIAM_BAD)"
fi

###############################################################################
# Summary
###############################################################################
echo ""
printf "${BOLD}══════════════════════════════════════════${RESET}\n"
printf "${BOLD}  E2E Test Summary${RESET}\n"
printf "${BOLD}══════════════════════════════════════════${RESET}\n"
printf "  Test email : %s\n" "$TEST_EMAIL"
printf "  Org ID     : %s\n" "$ORG_ID"
printf "  Total      : %d\n" "$TOTAL"
printf "  ${GREEN}Passed     : %d${RESET}\n" "$PASSED"
printf "  ${RED}Failed     : %d${RESET}\n" "$FAILED"
printf "${BOLD}══════════════════════════════════════════${RESET}\n"

if [[ "$FAILED" -gt 0 ]]; then
  printf "\n${RED}${BOLD}RESULT: FAILED${RESET}\n\n"
  exit 1
else
  printf "\n${GREEN}${BOLD}RESULT: ALL TESTS PASSED${RESET}\n\n"
  exit 0
fi
