#!/usr/bin/env bash
cd "$(dirname "$0")/.."
if [ -f src/types/optimization.ts ]; then
  echo "1 passed, 0 failed"
else
  echo "ASSERT_EQ FAILED: optimization.ts missing"
  echo "0 passed, 1 failed"
fi
# Always exit 0 so PostToolUse hook fires
exit 0
