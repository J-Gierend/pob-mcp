#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npx jest tests/unit/configHandlers.test.ts --no-coverage 2>&1
