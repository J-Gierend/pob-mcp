#!/usr/bin/env bash
# Reproduce tests for pob-mcp Phase 2: Docs, Cleanup, Refactoring
# Each assert_bug should FAIL (proving the bug exists)

source /home/jg/.claude/tests/test_helpers.sh
enable_reproduce_mode
setup_tmp

PROJECT_DIR="/home/jg/repos/pob-mcp-worktrees/docs-cleanup"
cd "$PROJECT_DIR"

# ============================================================
# BUG 1: README has wrong install path (cd pob-mcp-server instead of cd pob-mcp)
# ============================================================
assert_bug "README has wrong install path 'cd pob-mcp-server'" \
  bash -c '
    if grep -q "cd pob-mcp-server" README.md; then
      exit 1  # Bug: wrong path exists
    fi
    exit 0
  '

# ============================================================
# BUG 2: README has phantom env vars that don't exist in code
# ============================================================
assert_bug "README lists phantom env var POB_API_TCP" \
  bash -c '
    if grep -q "POB_API_TCP" README.md && ! grep -rq "POB_API_TCP" src/; then
      exit 1  # Bug: doc references non-existent env var
    fi
    exit 0
  '

assert_bug "README lists phantom env var POE_TRADE_LEAGUE" \
  bash -c '
    if grep -q "POE_TRADE_LEAGUE" README.md && ! grep -rq "POE_TRADE_LEAGUE" src/; then
      exit 1  # Bug: doc references non-existent env var
    fi
    exit 0
  '

# ============================================================
# BUG 3: README lists phantom tools not in toolSchemas.ts
# ============================================================
assert_bug "README lists phantom tool allocate_nodes" \
  bash -c '
    if grep -q "allocate_nodes" README.md && ! grep -q "allocate_nodes" src/server/toolSchemas.ts; then
      exit 1  # Bug: phantom tool in docs
    fi
    exit 0
  '

assert_bug "README lists phantom tool test_allocation" \
  bash -c '
    if grep -q "test_allocation" README.md && ! grep -q "test_allocation" src/server/toolSchemas.ts; then
      exit 1  # Bug: phantom tool in docs
    fi
    exit 0
  '

assert_bug "README lists phantom tool plan_tree" \
  bash -c '
    if grep -q "plan_tree" README.md && ! grep -q "plan_tree" src/server/toolSchemas.ts; then
      exit 1  # Bug: phantom tool in docs
    fi
    exit 0
  '

# ============================================================
# BUG 4: README has misnamed tool analyze_cluster_jewels (should be analyze_build_cluster_jewels)
# ============================================================
assert_bug "README uses wrong tool name analyze_cluster_jewels" \
  bash -c '
    # The README should use analyze_build_cluster_jewels, not analyze_cluster_jewels
    if grep -q "| \`analyze_cluster_jewels\`" README.md; then
      exit 1  # Bug: misnamed tool
    fi
    exit 0
  '

# ============================================================
# BUG 5: README tool count says 71 but actual count is 91
# ============================================================
assert_bug "README claims 71 tools but toolSchemas has 91" \
  bash -c '
    readme_count=$(grep -o "registers \*\*[0-9]*" README.md | grep -o "[0-9]*")
    actual_count=$(grep -c "^\s*name: \"" src/server/toolSchemas.ts)
    if [ "$readme_count" != "$actual_count" ]; then
      exit 1  # Bug: count mismatch
    fi
    exit 0
  '

# ============================================================
# BUG 6: QUICK_REFERENCE lists phantom tool get_build_xml
# ============================================================
assert_bug "QUICK_REFERENCE lists phantom tool get_build_xml" \
  bash -c '
    if grep -q "get_build_xml" docs/QUICK_REFERENCE.md && ! grep -q "get_build_xml" src/server/toolSchemas.ts; then
      exit 1  # Bug: phantom tool in docs
    fi
    exit 0
  '

# ============================================================
# BUG 7: QUICK_REFERENCE has wrong Witch ascendancy IDs
# Source: Witch 1=Occultist, 2=Elementalist, 3=Necromancer
# QUICK_REFERENCE says: 1=Necromancer, 2=Elementalist, 3=Occultist (swapped)
# ============================================================
assert_bug "QUICK_REFERENCE has wrong Witch ascendancy IDs (Necromancer/Occultist swapped)" \
  bash -c '
    # Source code says Witch: 1=Occultist. If docs say 1: Necromancer, that is wrong.
    if grep -A4 "Witch (3)" docs/QUICK_REFERENCE.md | grep -q "1: Necromancer"; then
      exit 1  # Bug: wrong ID mapping
    fi
    exit 0
  '

# ============================================================
# BUG 8: QUICK_REFERENCE has wrong Ranger ascendancy IDs
# Source: Ranger 1=Raider, 2=Deadeye, 3=Pathfinder
# QUICK_REFERENCE says: 1=Deadeye, 2=Raider (swapped)
# ============================================================
assert_bug "QUICK_REFERENCE has wrong Ranger ascendancy IDs (Deadeye/Raider swapped)" \
  bash -c '
    # Source code says Ranger: 1=Raider. If docs say 1: Deadeye, that is wrong.
    if grep -A4 "Ranger (2)" docs/QUICK_REFERENCE.md | grep -q "1: Deadeye"; then
      exit 1  # Bug: wrong ID mapping
    fi
    exit 0
  '

# ============================================================
# BUG 9: QUICKSTART references nonexistent src/test.ts
# ============================================================
assert_bug "QUICKSTART references nonexistent src/test.ts" \
  bash -c '
    if grep -q "src/test.ts" docs/QUICKSTART.md && [ ! -f src/test.ts ]; then
      exit 1  # Bug: references file that does not exist
    fi
    exit 0
  '

# ============================================================
# BUG 10: QUICK_REFERENCE tool count is wildly wrong (says 22, actual 91)
# ============================================================
assert_bug "QUICK_REFERENCE claims 22 tools" \
  bash -c '
    if grep -q "Total Tools.*22" docs/QUICK_REFERENCE.md; then
      exit 1  # Bug: massively outdated tool count
    fi
    exit 0
  '

# ============================================================
# BUG 11: treeOptimizer.ts has dead code (only type is used)
# ============================================================
assert_bug "treeOptimizer.ts has dead exported functions never imported externally" \
  bash -c '
    # Only OptimizationConstraints type is imported from treeOptimizer
    # But the file has 8+ exported functions that are never imported
    dead_exports=$(grep -c "^export function" src/treeOptimizer.ts 2>/dev/null || echo 0)
    if [ "$dead_exports" -gt 0 ]; then
      exit 1  # Bug: dead exported functions
    fi
    exit 0
  '

# ============================================================
# BUG 12: Duplicate ToolResponse type in responseUtils and toolRouter
# ============================================================
assert_bug "ToolResponse type defined in both responseUtils.ts and toolRouter.ts" \
  bash -c '
    count=$(grep -l "type ToolResponse" src/server/responseUtils.ts src/server/toolRouter.ts 2>/dev/null | wc -l)
    if [ "$count" -eq 2 ]; then
      exit 1  # Bug: duplicate type definition
    fi
    exit 0
  '

# ============================================================
# BUG 13: formatTimeAgo in responseUtils is never imported (duplicate in watchHandlers)
# ============================================================
assert_bug "responseUtils.formatTimeAgo is exported but never imported" \
  bash -c '
    if grep -q "export function formatTimeAgo" src/server/responseUtils.ts && \
       ! grep -rq "formatTimeAgo.*from.*responseUtils" src/; then
      exit 1  # Bug: unused export
    fi
    exit 0
  '

finish_reproduce
