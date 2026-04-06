#!/bin/zsh
# Zorbit Unified Console - Shell Aliases
# Source this file from ~/.zshrc
# Skill: 1011 (CLI Aliases)

_ZORB_PROJECT="/Users/s/workspace/zorbit/02_repos/zorbit-unified-console"
_ZORB_E2E="$_ZORB_PROJECT/testing/e2e-standalone-bundle"
_ZORB_SERVER="sovpn"
_ZORB_REMOTE="~/apps/zorbit-platform/zorbit-unified-console/"

# ---------------------------------------------------------------------------
# zorb — main entry point (subcommand dispatcher)
# ---------------------------------------------------------------------------
zorb() {
  local cmd="${1:-}"
  shift 2>/dev/null

  case "$cmd" in
    ""|open)
      open "https://zorbit.scalatics.com"
      ;;
    dev)
      (cd "$_ZORB_PROJECT" && npm run dev)
      ;;
    build)
      (cd "$_ZORB_PROJECT" && npx vite build)
      ;;
    deploy)
      zorb-deploy "$@"
      ;;
    test)
      zorb-test "$@"
      ;;
    bundle)
      echo "\033[36m→ Generating E2E test bundle zip...\033[0m"
      echo "\033[2m  \$ bash $_ZORB_PROJECT/testing/bundle.sh\033[0m"
      bash "$_ZORB_PROJECT/testing/bundle.sh"
      ;;
    logs)
      ssh "$_ZORB_SERVER" 'pm2 logs --lines 50 | grep zorbit'
      ;;
    status)
      ssh "$_ZORB_SERVER" 'pm2 status' | grep -E 'zorbit|Name|─'
      ;;
    restart)
      if [ -z "$1" ]; then
        echo "\033[31m✗ Usage: zorb restart <service-name>\033[0m"
        return 1
      fi
      ssh "$_ZORB_SERVER" "pm2 restart $1"
      echo "\033[32m✓ Restarted $1\033[0m"
      ;;
    ssh)
      ssh "$_ZORB_SERVER"
      ;;
    help)
      zorb-help
      ;;
    *)
      echo "\033[31m✗ Unknown command: $cmd\033[0m"
      echo "  Type '\033[1;33mzorb help\033[0m' for available commands."
      return 1
      ;;
  esac
}

# ---------------------------------------------------------------------------
# zorb-deploy — build + rsync to server
# ---------------------------------------------------------------------------
zorb-deploy() {
  local ver=$(node -e "console.log(require('$_ZORB_PROJECT/package.json').version)")
  echo "\033[36m→ Building Zorbit Unified Console v${ver}...\033[0m"
  (cd "$_ZORB_PROJECT" && npx vite build)
  if [ $? -ne 0 ]; then
    echo "\033[31m✗ Build failed. Deploy aborted.\033[0m"
    return 1
  fi
  echo "\033[36m→ Deploying to $_ZORB_SERVER...\033[0m"
  rsync -avz --delete \
    "$_ZORB_PROJECT/dist/" \
    "$_ZORB_SERVER:$_ZORB_REMOTE"
  echo "\033[32m✓ v${ver} deployed to production\033[0m"
}

# ---------------------------------------------------------------------------
# Helper: find which config file contains a bouquet/journey/segment
# Sets _ZORB_FOUND_CONFIG, _ZORB_FOUND_TYPE
# If collision (same name in multiple configs), prints options with copy-paste commands
# ---------------------------------------------------------------------------
_zorb_find() {
  local name="$1"
  _ZORB_FOUND_CONFIG="" _ZORB_FOUND_TYPE=""

  # Exact config file?
  [ -f "$_ZORB_E2E/configs/${name}.json" ] && _ZORB_FOUND_CONFIG="$name" _ZORB_FOUND_TYPE="config" && return 0

  # Fuzzy config match (e.g. "smoke" -> "smoke-test")
  local m=$(ls "$_ZORB_E2E"/configs/*.json 2>/dev/null | xargs -I{} basename {} .json | grep -i "$name" | head -1)
  [ -n "$m" ] && _ZORB_FOUND_CONFIG="$m" _ZORB_FOUND_TYPE="config" && return 0

  # Search bouquets, journeys, segments across ALL configs — collect all matches
  local -a matches=()
  for cfg in "$_ZORB_E2E"/configs/*.json; do
    [ ! -f "$cfg" ] && continue
    local cname=$(basename "$cfg" .json)
    local found=$(node -e "
      const c=require('$cfg');
      if(c.bouquets?.['$name'])  { console.log('bouquet');  process.exit(0); }
      if(c.journeys?.['$name']) { console.log('journey');  process.exit(0); }
      if(c.segments?.['$name']) { console.log('segment');  process.exit(0); }
    " 2>/dev/null)
    [ -n "$found" ] && matches+=("${cname}:${found}")
  done

  # No matches
  [ ${#matches[@]} -eq 0 ] && return 1

  # Unique match — use it directly
  if [ ${#matches[@]} -eq 1 ]; then
    _ZORB_FOUND_CONFIG="${matches[1]%%:*}"
    _ZORB_FOUND_TYPE="${matches[1]#*:}"
    return 0
  fi

  # Collision! Multiple configs have this name — show options
  echo ""
  echo "\033[1;33m  '$name' found in ${#matches[@]} configs. Pick one:\033[0m"
  echo ""
  for entry in "${matches[@]}"; do
    local ecfg="${entry%%:*}"
    local etype="${entry#*:}"
    local flag="--${etype}"
    echo "  \033[32m•\033[0m \033[1m${ecfg}\033[0m \033[2m(as ${etype})\033[0m"
    echo "    \033[33mzorb test run ${ecfg} ${flag}=${name}\033[0m"
    echo "    \033[2mcd $_ZORB_E2E && npx tsx runner.ts --config ${ecfg} ${flag} ${name}\033[0m"
    echo ""
  done
  return 2  # collision — caller should not proceed
}

# ---------------------------------------------------------------------------
# Helper: print the raw command before running
# ---------------------------------------------------------------------------
_zorb_run() {
  local display_cmd="cd $_ZORB_E2E && npx tsx runner.ts $*"
  echo ""
  echo "\033[2m  \$ $display_cmd\033[0m"
  echo ""
  (cd "$_ZORB_E2E" && npx tsx runner.ts "$@")
  return $?
}

# ---------------------------------------------------------------------------
# zorb-test — E2E test runner (dynamic config discovery)
# ---------------------------------------------------------------------------
# Usage:
#   zorb test                          list all tests
#   zorb test list                     list all tests
#   zorb test show <name>              drill into a bouquet/journey/segment
#   zorb test run  <name> [--headless] run a bouquet, journey, or segment
#   zorb test <name> [--headless]      shortcut for "run"
#   zorb test all [--headless]         run every config
# ---------------------------------------------------------------------------
zorb-test() {
  local subcmd="${1:-}"
  shift 2>/dev/null

  case "$subcmd" in
    ""|list)  zorb-test-list;  return 0 ;;
    show)     zorb-test-show "$@"; return $? ;;
    run)      zorb-test-run  "$@"; return $? ;;
    all)      zorb-test-all  "$@"; return $? ;;
    help)
      echo ""
      echo "\033[1;36m  zorb test commands\033[0m"
      echo "\033[36m  ─────────────────────────────────────────────────\033[0m"
      echo "  \033[1mzorb test\033[0m                     List all configs + bouquets"
      echo "  \033[1mzorb test show <name>\033[0m         Drill into bouquet -> journeys -> segments"
      echo "  \033[1mzorb test run  <name>\033[0m         Run a bouquet, journey, or segment"
      echo "  \033[1mzorb test <name>\033[0m              Same as 'run' (shortcut)"
      echo "  \033[1mzorb test all\033[0m                 Run every config sequentially"
      echo "    \033[2mAppend --headless to any run command\033[0m"
      echo ""
      return 0
      ;;
    *)        zorb-test-run "$subcmd" "$@"; return $? ;;
  esac
}

# ---------------------------------------------------------------------------
# zorb-test-all — run every config
# ---------------------------------------------------------------------------
zorb-test-all() {
  local headless=""
  [[ " $* " == *" --headless "* ]] && headless="--headless"

  echo "\033[1;36m  Running all E2E configs sequentially...\033[0m"
  local passed=0 failed=0
  for cfg in "$_ZORB_E2E"/configs/*.json; do
    local cname=$(basename "$cfg" .json)
    echo "\n\033[36m→ $cname\033[0m"
    _zorb_run --config "$cname" $headless
    [ $? -eq 0 ] && ((passed++)) || ((failed++))
  done
  echo "\n\033[1;36m  Results: \033[32m$passed passed\033[0m, \033[31m$failed failed\033[0m"
}

# ---------------------------------------------------------------------------
# zorb-test-run — resolve name and execute
# Supports:
#   zorb test run smoke-test                      (config)
#   zorb test run awnic-full                      (bouquet, auto-discovered)
#   zorb test run setup                           (journey, auto-discovered)
#   zorb test run login                           (segment, auto-discovered)
#   zorb test run awnic-flow --bouquet=awnic-full  (explicit)
#   zorb test run awnic-flow --journey=setup       (explicit)
#   zorb test run awnic-flow --segment=login       (explicit)
# ---------------------------------------------------------------------------
zorb-test-run() {
  local name="${1:-}"
  [ -z "$name" ] && echo "\033[31m✗ Usage: zorb test run <name> [--headless]\033[0m" && return 1
  shift 2>/dev/null

  # Parse flags
  local headless="" explicit_bouquet="" explicit_journey="" explicit_segment=""
  for arg in "$@"; do
    case "$arg" in
      --headless)          headless="--headless" ;;
      --bouquet=*)         explicit_bouquet="${arg#--bouquet=}" ;;
      --journey=*)         explicit_journey="${arg#--journey=}" ;;
      --segment=*)         explicit_segment="${arg#--segment=}" ;;
    esac
  done

  # If explicit flags given, just run with them
  if [ -n "$explicit_bouquet" ]; then
    _zorb_run --config "$name" --bouquet "$explicit_bouquet" $headless; return $?
  fi
  if [ -n "$explicit_journey" ]; then
    _zorb_run --config "$name" --journey "$explicit_journey" $headless; return $?
  fi
  if [ -n "$explicit_segment" ]; then
    _zorb_run --config "$name" --segment "$explicit_segment" $headless; return $?
  fi

  # Auto-discover
  _zorb_find "$name"
  local rc=$?

  # Collision (rc=2) — _zorb_find already printed the options
  [ $rc -eq 2 ] && return 1

  # Not found
  if [ $rc -ne 0 ] || [ -z "$_ZORB_FOUND_CONFIG" ]; then
    echo "\033[31m✗ No config, bouquet, journey, or segment matching: $name\033[0m"
    echo "  Run \033[1;33mzorb test list\033[0m to see what's available."
    return 1
  fi

  case "$_ZORB_FOUND_TYPE" in
    config)
      _zorb_run --config "$_ZORB_FOUND_CONFIG" $headless ;;
    bouquet)
      _zorb_run --config "$_ZORB_FOUND_CONFIG" --bouquet "$name" $headless ;;
    journey)
      _zorb_run --config "$_ZORB_FOUND_CONFIG" --journey "$name" $headless ;;
    segment)
      _zorb_run --config "$_ZORB_FOUND_CONFIG" --segment "$name" $headless ;;
  esac
}

# ---------------------------------------------------------------------------
# zorb-test-show — drill into bouquet/journey/segment details
# ---------------------------------------------------------------------------
zorb-test-show() {
  local name="${1:-}"
  local sub="${2:-}"

  if [ -z "$name" ]; then
    echo "\033[31m✗ Usage: zorb test show <bouquet|journey|config>\033[0m"
    return 1
  fi

  _zorb_find "$name"
  local rc=$?
  [ $rc -eq 2 ] && return 1  # collision — options already printed
  if [ -z "$_ZORB_FOUND_CONFIG" ]; then
    echo "\033[31m✗ Not found: $name\033[0m"
    return 1
  fi

  local cfg="$_ZORB_E2E/configs/${_ZORB_FOUND_CONFIG}.json"

  # If a sub-argument is given, drill one level deeper
  if [ -n "$sub" ]; then
    # Show a specific journey's segments
    node -e "
      const c = require('$cfg');
      const j = c.journeys?.['$sub'];
      if (!j) { console.log('\x1b[31m✗ Journey not found: $sub\x1b[0m'); process.exit(1); }
      console.log();
      console.log('\x1b[1;36m  Journey: ' + j.name + '\x1b[0m');
      console.log('\x1b[2m  ' + (j.description || '') + '\x1b[0m');
      console.log('\x1b[36m  ─────────────────────────────────────────────────\x1b[0m');
      console.log();
      (j.segments || []).forEach((sid, i) => {
        const s = c.segments?.[sid];
        const stepCount = s ? s.steps.length : 0;
        console.log('  \x1b[32m' + (i+1) + '.\x1b[0m \x1b[1m' + sid + '\x1b[0m  \x1b[2m(' + stepCount + ' steps)\x1b[0m');
        if (s) console.log('     \x1b[2m' + (s.description || s.name) + '\x1b[0m');
        console.log('     \x1b[33m→ zorb test run ' + sid + '\x1b[0m');
        if (s) {
          s.steps.forEach((st, si) => {
            const label = st.announce?.before || st.announce?.after || st.selector || st.url || st.value || '';
            console.log('     \x1b[2m  ' + (si+1) + '. ' + st.action + (label ? ' — ' + label.substring(0,60) : '') + '\x1b[0m');
          });
        }
        console.log();
      });
    " 2>/dev/null
    return $?
  fi

  # Show details based on what was found
  case "$_ZORB_FOUND_TYPE" in
    config)
      # Show all bouquets in this config
      node -e "
        const c = require('$cfg');
        const cn = '$_ZORB_FOUND_CONFIG';
        console.log();
        console.log('\x1b[1;36m  Config: ' + cn + '\x1b[0m');
        console.log('\x1b[2m  Target: ' + (c.baseUrl || '?') + '\x1b[0m');
        console.log('\x1b[2m  ' + Object.keys(c.segments||{}).length + ' segments, ' + Object.keys(c.journeys||{}).length + ' journeys, ' + Object.keys(c.bouquets||{}).length + ' bouquets\x1b[0m');
        console.log('\x1b[36m  ─────────────────────────────────────────────────\x1b[0m');
        console.log();
        Object.entries(c.bouquets||{}).forEach(([bid,b]) => {
          console.log('  \x1b[1;33m' + bid + '\x1b[0m  \x1b[2m— ' + (b.name||bid) + '\x1b[0m');
          console.log('     \x1b[2m' + (b.description||'') + '\x1b[0m');
          console.log('     \x1b[33m→ zorb test run ' + bid + '\x1b[0m');
          console.log('     \x1b[33m→ zorb test show ' + bid + '\x1b[0m  \x1b[2m(drill in)\x1b[0m');
          console.log();
        });
      " 2>/dev/null
      ;;
    bouquet)
      # Show journeys in this bouquet
      node -e "
        const c = require('$cfg');
        const b = c.bouquets?.['$name'];
        if (!b) process.exit(1);
        console.log();
        console.log('\x1b[1;36m  Bouquet: ' + (b.name || '$name') + '\x1b[0m');
        console.log('\x1b[2m  ' + (b.description || '') + '\x1b[0m');
        console.log('\x1b[2m  Config: $_ZORB_FOUND_CONFIG  |  Mode: ' + (b.mode || 'sequential') + '\x1b[0m');
        console.log('\x1b[36m  ─────────────────────────────────────────────────\x1b[0m');
        console.log();
        console.log('  \x1b[33m→ zorb test run $name\x1b[0m  \x1b[2m(run entire bouquet)\x1b[0m');
        console.log();
        (b.journeys || []).forEach((jid, i) => {
          const j = c.journeys?.[jid];
          const segCount = j ? (j.segments||[]).length : 0;
          console.log('  \x1b[32m' + (i+1) + '.\x1b[0m \x1b[1m' + jid + '\x1b[0m  \x1b[2m(' + segCount + ' segments)\x1b[0m');
          if (j) console.log('     \x1b[2m' + (j.description || j.name) + '\x1b[0m');
          console.log('     \x1b[33m→ zorb test run ' + jid + '\x1b[0m');
          console.log('     \x1b[33m→ zorb test show $name ' + jid + '\x1b[0m  \x1b[2m(see segments + steps)\x1b[0m');
          console.log();
        });
      " 2>/dev/null
      ;;
    journey)
      # Show segments in this journey
      zorb-test-show "$_ZORB_FOUND_CONFIG" "$name"
      ;;
    segment)
      # Show steps in this segment
      node -e "
        const c = require('$cfg');
        const s = c.segments?.['$name'];
        if (!s) process.exit(1);
        console.log();
        console.log('\x1b[1;36m  Segment: ' + s.name + '\x1b[0m');
        console.log('\x1b[2m  ' + (s.description || '') + '\x1b[0m');
        console.log('\x1b[2m  Config: $_ZORB_FOUND_CONFIG  |  Steps: ' + s.steps.length + '\x1b[0m');
        console.log('\x1b[36m  ─────────────────────────────────────────────────\x1b[0m');
        console.log();
        console.log('  \x1b[33m→ zorb test run $name\x1b[0m  \x1b[2m(run this segment)\x1b[0m');
        console.log();
        s.steps.forEach((st, i) => {
          const label = st.announce?.before || st.announce?.after || '';
          const target = st.selector || st.url || st.value || st.pattern || '';
          const detail = [label, target].filter(Boolean).join(' — ').substring(0, 70);
          console.log('  \x1b[32m' + (i+1) + '.\x1b[0m \x1b[1m' + st.action + '\x1b[0m' + (detail ? '  \x1b[2m' + detail + '\x1b[0m' : ''));
        });
        console.log();
      " 2>/dev/null
      ;;
  esac
}

# ---------------------------------------------------------------------------
# zorb-test-list — scan configs/ and list all tests with run commands
# ---------------------------------------------------------------------------
zorb-test-list() {
  echo ""
  echo "\033[1;36m  Available E2E Tests\033[0m"
  echo "\033[36m  ═══════════════════════════════════════════════════════\033[0m"
  echo ""

  local idx=0
  for cfg in "$_ZORB_E2E"/configs/*.json; do
    [ ! -f "$cfg" ] && continue
    local cname=$(basename "$cfg" .json)
    ((idx++))

    local info=$(node -e "
      const c = require('$cfg');
      const sc = Object.keys(c.segments||{}).length;
      const jc = Object.keys(c.journeys||{}).length;
      const bc = Object.keys(c.bouquets||{}).length;
      console.log(sc + '|' + jc + '|' + bc + '|' + (c.baseUrl||'?'));
    " 2>/dev/null)
    local seg_count=$(echo "$info" | cut -d'|' -f1)
    local jour_count=$(echo "$info" | cut -d'|' -f2)
    local bouq_count=$(echo "$info" | cut -d'|' -f3)
    local base_url=$(echo "$info" | cut -d'|' -f4)

    echo "  \033[1;33m${idx}. ${cname}\033[0m  \033[2m(${seg_count} segments, ${jour_count} journeys, ${bouq_count} bouquets)\033[0m"
    echo "     \033[2mTarget: ${base_url}\033[0m"
    echo "     \033[33m→ zorb test show ${cname}\033[0m  \033[2m(drill in)\033[0m"
    echo "     \033[33m→ zorb test run  ${cname}\033[0m  \033[2m(run default)\033[0m"

    # List bouquets compactly
    local bouquets=$(node -e "
      const c = require('$cfg');
      Object.entries(c.bouquets||{}).forEach(([k,v]) => {
        const jc = (v.journeys||[]).length;
        console.log(k + '|' + (v.name||k) + '|' + jc);
      });
    " 2>/dev/null)

    if [ -n "$bouquets" ]; then
      echo "     \033[36mBouquets:\033[0m"
      echo "$bouquets" | while IFS='|' read -r bid bname bjcount; do
        echo "       \033[32m•\033[0m ${bname} \033[2m(${bjcount} journeys)\033[0m  \033[33m→ zorb test ${bid}\033[0m"
      done
    fi
    echo ""
  done

  echo "\033[36m  ─────────────────────────────────────────────────────────\033[0m"
  echo "  \033[2mDrill down:  zorb test show <bouquet>                   see journeys\033[0m"
  echo "  \033[2m             zorb test show <bouquet> <journey>          see segments + steps\033[0m"
  echo "  \033[2mRun:         zorb test <name>                           run any bouquet/journey/segment\033[0m"
  echo "  \033[2m             zorb test all [--headless]                  run everything\033[0m"
  echo ""
}

# ---------------------------------------------------------------------------
# zorb-help — colored help menu
# ---------------------------------------------------------------------------
zorb-help() {
  local ver=$(node -e "console.log(require('$_ZORB_PROJECT/package.json').version)" 2>/dev/null || echo "?.?.?")
  echo ""
  echo "\033[1;36m  Zorbit Unified Console v${ver} - CLI Commands\033[0m"
  echo "\033[36m  ───────────────────────────────────────────────────\033[0m"
  echo ""
  echo "  \033[1mzorb\033[0m                        Open console in browser"
  echo "  \033[1mzorb dev\033[0m                    Start Vite dev server"
  echo "  \033[1mzorb build\033[0m                  Build with Vite"
  echo "  \033[1mzorb deploy\033[0m                 Build + rsync to server"
  echo ""
  echo "\033[36m  Testing (auto-discovers configs/)\033[0m"
  echo "\033[36m  ───────────────────────────────────────────────────\033[0m"
  echo "  \033[1mzorb test\033[0m                   List all configs + bouquets"
  echo "  \033[1mzorb test show <name>\033[0m       Drill: bouquet -> journeys -> segments -> steps"
  echo "  \033[1mzorb test <name>\033[0m            Run any bouquet, journey, or segment"
  echo "  \033[1mzorb test all\033[0m               Run every config sequentially"
  echo "    \033[2mAppend --headless for headless mode\033[0m"
  echo "    \033[2mExamples: zorb test smoke, zorb test show awnic-full\033[0m"
  echo ""
  echo ""
  echo "\033[36m  Bundle\033[0m"
  echo "\033[36m  ───────────────────────────────────────────────────\033[0m"
  echo "  \033[1mzorb bundle\033[0m                 Generate portable E2E zip for developers"
  echo ""
  echo "\033[36m  Server\033[0m"
  echo "\033[36m  ───────────────────────────────────────────────────\033[0m"
  echo "  \033[1mzorb logs\033[0m                   PM2 logs (grep zorbit)"
  echo "  \033[1mzorb status\033[0m                 PM2 status of services"
  echo "  \033[1mzorb restart\033[0m <service>      Restart a service"
  echo "  \033[1mzorb ssh\033[0m                    SSH into server"
  echo ""
  echo "  \033[1mzorb help\033[0m                   Show this help"
  echo ""
}

# ---------------------------------------------------------------------------
# Load notification
# ---------------------------------------------------------------------------
echo "  \033[1;36mZorbit\033[0m aliases loaded. Type '\033[1;33mzorb help\033[0m' for commands."
