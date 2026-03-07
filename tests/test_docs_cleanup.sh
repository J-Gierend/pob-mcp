#!/usr/bin/env bash
# Tests for pob-mcp Phase 2: Docs, Cleanup, Refactoring
cd "$(dirname "$0")/.."

PASS=0
FAIL=0

assert_eq() {
  local desc="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo "PASS: $desc"
    PASS=$((PASS + 1))
  else
    echo "ASSERT_EQ FAILED: $desc (expected='$expected', actual='$actual')"
    FAIL=$((FAIL + 1))
  fi
}

assert_contains() {
  local desc="$1" haystack="$2" needle="$3"
  if echo "$haystack" | grep -qF "$needle"; then
    echo "PASS: $desc"
    PASS=$((PASS + 1))
  else
    echo "ASSERT_CONTAINS FAILED: $desc (needle='$needle' not found)"
    FAIL=$((FAIL + 1))
  fi
}

assert_not_contains() {
  local desc="$1" haystack="$2" needle="$3"
  if ! echo "$haystack" | grep -qF "$needle"; then
    echo "PASS: $desc"
    PASS=$((PASS + 1))
  else
    echo "ASSERT_CONTAINS FAILED: $desc (needle='$needle' should NOT be present)"
    FAIL=$((FAIL + 1))
  fi
}

# ============================================================
# Phase 1: Documentation Sync
# ============================================================

# Minimal output mode — only print failures
README=$(cat README.md)
QUICK_REF=$(cat docs/QUICK_REFERENCE.md)
QUICKSTART=$(cat docs/QUICKSTART.md)

# BUG 1: README install path
assert_not_contains "README: no 'cd pob-mcp-server'" "$README" "cd pob-mcp-server"
assert_contains "README: has 'cd pob-mcp'" "$README" "cd pob-mcp"

# BUG 2: Phantom env vars removed
assert_not_contains "README: no POB_API_TCP" "$README" "POB_API_TCP"
assert_not_contains "README: no POB_API_TCP_HOST" "$README" "POB_API_TCP_HOST"
assert_not_contains "README: no POB_API_TCP_PORT" "$README" "POB_API_TCP_PORT"
assert_not_contains "README: no POE_TRADE_LEAGUE" "$README" "POE_TRADE_LEAGUE"

# BUG 3: Phantom tools removed from README
assert_not_contains "README: no allocate_nodes" "$README" "allocate_nodes"
assert_not_contains "README: no test_allocation" "$README" "test_allocation"
assert_not_contains "README: no plan_tree" "$README" "plan_tree"

# BUG 4: Misnamed tool fixed
assert_not_contains "README: no analyze_cluster_jewels (wrong name)" "$README" "| \`analyze_cluster_jewels\`"
assert_contains "README: has analyze_build_cluster_jewels" "$README" "analyze_build_cluster_jewels"

# BUG 5: Tool count matches reality
ACTUAL_COUNT=$(grep -c '^\s*name: "' src/server/toolSchemas.ts)
assert_contains "README: tool count matches ($ACTUAL_COUNT)" "$README" "registers **${ACTUAL_COUNT} tools**"

# BUG 6: QUICK_REFERENCE phantom tool removed
assert_not_contains "QUICK_REF: no get_build_xml" "$QUICK_REF" "get_build_xml"

# BUG 7: Witch ascendancy IDs correct
# Source: Witch: 1=Occultist, 2=Elementalist, 3=Necromancer
WITCH_SECTION=$(echo "$QUICK_REF" | sed -n '/Witch/,/^$/p')
assert_contains "QUICK_REF: Witch 1=Occultist" "$WITCH_SECTION" "1: Occultist"
assert_contains "QUICK_REF: Witch 3=Necromancer" "$WITCH_SECTION" "3: Necromancer"

# BUG 8: Ranger ascendancy IDs correct
# Source: Ranger: 1=Raider, 2=Deadeye, 3=Pathfinder
RANGER_SECTION=$(echo "$QUICK_REF" | sed -n '/Ranger/,/^$/p')
assert_contains "QUICK_REF: Ranger 1=Raider" "$RANGER_SECTION" "1: Raider"
assert_contains "QUICK_REF: Ranger 2=Deadeye" "$RANGER_SECTION" "2: Deadeye"

# BUG 9: QUICKSTART no src/test.ts
assert_not_contains "QUICKSTART: no src/test.ts" "$QUICKSTART" "src/test.ts"

# BUG 10: QUICK_REFERENCE tool count updated
assert_not_contains "QUICK_REF: no 'Total Tools.*22'" "$QUICK_REF" "Total Tools: 22"

# QUICK_REF: phantom TCP env vars removed
assert_not_contains "QUICK_REF: no POB_API_TCP section" "$QUICK_REF" "POB_API_TCP"

# ============================================================
# Phase 2: Stale File Archival
# ============================================================

# Stale files moved to archive
for f in PHASE_7_DESIGN.md PHASE_8_DESIGN.md PHASE_9_DESIGN.md PHASE_11_DESIGN.md PLACEHOLDERS_AUDIT.md REFACTORING_OPPORTUNITIES.md TRADE_API_IMPLEMENTATION_PLAN.md; do
  if [ -f "$f" ]; then
    echo "ASSERT_CONTAINS FAILED: Stale file $f should be archived"
    FAIL=$((FAIL + 1))
  else
    echo "PASS: $f archived (not in root)"
    PASS=$((PASS + 1))
  fi
done

for f in PHASE_CONFIGURATION_STATE_COMPLETE.md PHASE_FLASK_ANALYSIS_COMPLETE.md PHASE_JEWEL_PARSING_COMPLETE.md; do
  if [ -f "docs/$f" ]; then
    echo "ASSERT_CONTAINS FAILED: Stale docs/$f should be archived"
    FAIL=$((FAIL + 1))
  else
    echo "PASS: docs/$f archived"
    PASS=$((PASS + 1))
  fi
done

# .gitignore entries
GITIGNORE=$(cat .gitignore)
assert_contains ".gitignore: jest-output.json" "$GITIGNORE" "jest-output.json"
assert_contains ".gitignore: .plan.md" "$GITIGNORE" ".plan.md"

# ============================================================
# Phase 3: Dead Code Cleanup
# ============================================================

# BUG 11: treeOptimizer.ts dead code removed
if [ -f src/treeOptimizer.ts ]; then
  DEAD_EXPORTS=$(grep -c "^export function" src/treeOptimizer.ts 2>/dev/null || echo 0)
  assert_eq "treeOptimizer.ts: no dead exported functions" "0" "$DEAD_EXPORTS"
else
  echo "PASS: treeOptimizer.ts removed (type moved)"
  PASS=$((PASS + 1))
fi

# OptimizationConstraints type still importable
assert_eq "OptimizationConstraints type exists in types/" "1" "$(ls src/types/optimization.ts 2>/dev/null | wc -l)"

# BUG 12: Duplicate ToolResponse fixed
TOOLRESPONSE_DEFS=$(grep -l "type ToolResponse" src/server/responseUtils.ts src/server/toolRouter.ts 2>/dev/null | wc -l)
assert_eq "ToolResponse: defined in only one file" "1" "$TOOLRESPONSE_DEFS"

# BUG 13: formatTimeAgo removed from responseUtils
if grep -q "export function formatTimeAgo" src/server/responseUtils.ts 2>/dev/null; then
  echo "ASSERT_CONTAINS FAILED: formatTimeAgo still exported from responseUtils.ts"
  FAIL=$((FAIL + 1))
else
  echo "PASS: formatTimeAgo removed from responseUtils.ts"
  PASS=$((PASS + 1))
fi

# Dead exports removed from itemAnalyzer
if grep -q "export function analyzeItemSlot" src/itemAnalyzer.ts 2>/dev/null; then
  echo "ASSERT_CONTAINS FAILED: analyzeItemSlot still exported from itemAnalyzer.ts"
  FAIL=$((FAIL + 1))
else
  echo "PASS: analyzeItemSlot removed from itemAnalyzer.ts"
  PASS=$((PASS + 1))
fi

if grep -q "export function checkResistances" src/itemAnalyzer.ts 2>/dev/null; then
  echo "ASSERT_CONTAINS FAILED: checkResistances still exported from itemAnalyzer.ts"
  FAIL=$((FAIL + 1))
else
  echo "PASS: checkResistances removed from itemAnalyzer.ts"
  PASS=$((PASS + 1))
fi

# Dead exports removed from skillLinkOptimizer
for fn in detectSkillType isSupportGem analyzeSkillGroup; do
  if grep -q "export function $fn" src/skillLinkOptimizer.ts 2>/dev/null; then
    echo "ASSERT_CONTAINS FAILED: $fn still exported from skillLinkOptimizer.ts"
    FAIL=$((FAIL + 1))
  else
    echo "PASS: $fn removed from skillLinkOptimizer.ts"
    PASS=$((PASS + 1))
  fi
done

# ============================================================
# Phase 4: Complexity Refactoring
# ============================================================

# toolRouter uses dispatch table instead of giant switch
SWITCH_CASES=$(grep -c 'case "' src/server/toolRouter.ts 2>/dev/null)
[ -z "$SWITCH_CASES" ] && SWITCH_CASES=0
assert_eq "toolRouter: no switch cases (uses dispatch table)" "0" "$SWITCH_CASES"

# tradeContext not duplicated (should be <=1 occurrence)
TRADE_CTX_COUNT=$(grep -c "const tradeContext = {" src/server/toolRouter.ts 2>/dev/null)
[ -z "$TRADE_CTX_COUNT" ] && TRADE_CTX_COUNT=0
if [ "$TRADE_CTX_COUNT" -le 1 ]; then
  echo "PASS: tradeContext not duplicated ($TRADE_CTX_COUNT occurrences)"
  PASS=$((PASS + 1))
else
  echo "ASSERT_EQ FAILED: tradeContext duplicated $TRADE_CTX_COUNT times (expected <=1)"
  FAIL=$((FAIL + 1))
fi

# ============================================================
# Phase 5: Stale dispatch entries
# ============================================================

ROUTER=$(cat src/server/toolRouter.ts)
assert_not_contains "toolRouter: no stale analyze_cluster_jewels entry" "$ROUTER" '"analyze_cluster_jewels"'

# ============================================================
# Summary
# ============================================================
echo ""
echo "========================================"
echo "Results: $PASS passed, $FAIL failed"
echo "========================================"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
