#!/usr/bin/env bash
# Pre-flight check before UI exploration with playwright-cli.
# Verifies auth state is fresh. If stale or missing, re-runs auth setup.
# Usage: bash .claude/skills/test-generator-e2e/scripts/pre-explore.sh

set -e

AUTH_FILE="playwright/.auth/user.json"
FRESHNESS=${AUTH_FRESHNESS_MINUTES:-30}

if [ -f "$AUTH_FILE" ]; then
  AGE_MIN=$(( ($(date +%s) - $(stat -f %m "$AUTH_FILE")) / 60 ))
  if [ "$AGE_MIN" -lt "$FRESHNESS" ]; then
    echo "[pre-explore] OK: Auth state is fresh (${AGE_MIN}m old, threshold ${FRESHNESS}m)"
    exit 0
  fi
  echo "[pre-explore] Auth state is stale (${AGE_MIN}m old, threshold ${FRESHNESS}m)"
else
  echo "[pre-explore] Auth state file not found"
fi

echo "[pre-explore] Running auth setup..."
npx playwright test --project=setup
echo "[pre-explore] Auth setup complete"
