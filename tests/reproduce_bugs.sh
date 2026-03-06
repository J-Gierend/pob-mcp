#!/usr/bin/env bash
# Reproduce tests for pob-mcp full-repair plan
# Each assert_bug should FAIL (proving the bug exists)

source /home/jg/.claude/tests/test_helpers.sh
enable_reproduce_mode
setup_tmp

PROJECT_DIR="/home/jg/repos/pob-mcp-worktrees/full-repair"
cd "$PROJECT_DIR"

# ============================================================
# BUG 1: Path traversal vulnerability — no sanitization on buildName
# All path.join(pobDirectory, buildName) calls accept "../" without checking
# ============================================================
assert_bug "Path traversal: buildName with ../ is not rejected" \
  node -e "
    const path = require('path');
    // Simulate what buildService.ts:64 does
    const pobDirectory = '/home/user/.config/PathOfBuilding/Builds';
    const buildName = '../../etc/passwd';
    const buildPath = path.join(pobDirectory, buildName);
    // If a sanitizer existed, it would throw. Instead it resolves to /home/user/.config/etc/passwd
    if (!buildPath.startsWith(pobDirectory)) {
      process.exit(1); // Bug exists: path escapes base dir
    }
    process.exit(0); // No bug: path stays within base dir
  "

# ============================================================
# BUG 2: Three test suites fail to compile/run
# ============================================================
assert_bug "contextBuilder.test.ts fails to run (compile error)" \
  npx jest --no-coverage tests/contextBuilder.test.ts 2>/dev/null

assert_bug "buildHandlers.test.ts fails to run (compile error)" \
  npx jest --no-coverage tests/unit/buildHandlers.test.ts 2>/dev/null

assert_bug "pobLuaBridge.simple.test.ts fails to run (compile error)" \
  npx jest --no-coverage tests/unit/pobLuaBridge.simple.test.ts 2>/dev/null

# ============================================================
# BUG 3: Test assertion failures in existing tests
# ============================================================
assert_bug "validationService.test.ts has failing assertions" \
  npx jest --no-coverage tests/unit/validationService.test.ts 2>/dev/null

assert_bug "pobLuaBridge.test.ts has failing assertions" \
  npx jest --no-coverage tests/unit/pobLuaBridge.test.ts 2>/dev/null

assert_bug "treeService.test.ts has failing assertion" \
  npx jest --no-coverage tests/treeService.test.ts 2>/dev/null

assert_bug "buildService.test.ts has failing assertions" \
  npx jest --no-coverage tests/unit/buildService.test.ts 2>/dev/null

# ============================================================
# BUG 4: Dead code — nodeOptimizer.ts exists but is never imported
# ============================================================
assert_bug "nodeOptimizer.ts is dead code (never imported)" \
  bash -c '
    cd /home/jg/repos/pob-mcp-worktrees/full-repair
    # Check if anything imports nodeOptimizer
    imports=$(grep -r "nodeOptimizer" src/ --include="*.ts" -l | grep -v "nodeOptimizer.ts" | wc -l)
    if [ "$imports" -eq 0 ]; then
      exit 1  # Bug: dead code exists (nothing imports it)
    fi
    exit 0  # No bug: it is imported somewhere
  '

finish_reproduce
