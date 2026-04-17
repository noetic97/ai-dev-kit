#!/bin/bash
# PostToolUse hook: run tests after Write or Edit tool calls.
# Guards: only fires if bun is available and test files exist in the project.
# Bails after first failure to surface the problem immediately.
if command -v bun &> /dev/null && find . -name "*.test.ts" -not -path "*/node_modules/*" | grep -q .; then
  echo "[hook] Running tests after file write..."
  bun test --bail 2>&1 | tail -20
fi
