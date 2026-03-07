#!/usr/bin/env bash
cd "$(dirname "$0")/.."

ROUTER=$(cat src/server/toolRouter.ts)

if echo "$ROUTER" | grep -qF '"analyze_cluster_jewels"'; then
  echo "ASSERT_CONTAINS FAILED: toolRouter has stale analyze_cluster_jewels entry"
  echo "0 passed, 1 failed"
else
  echo "PASS: no stale analyze_cluster_jewels entry"
  echo "1 passed, 0 failed"
fi
