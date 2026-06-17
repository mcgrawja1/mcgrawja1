#!/usr/bin/env bash
# Sanity-check the data source the widget uses.
# If this prints JSON with a "blocks" array, the widget will work.
# If it prints nothing, you have no active 5-hour window right now
# (send a message in Claude Code first).
#
# Usage:  ./check-usage.sh
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.bun/bin:$HOME/.npm-global/bin:$HOME/.local/bin:$PATH"

run() {
  if command -v ccusage >/dev/null 2>&1; then
    ccusage blocks --active --json
  elif command -v bunx >/dev/null 2>&1; then
    bunx ccusage blocks --active --json
  elif command -v npx >/dev/null 2>&1; then
    npx -y ccusage@latest blocks --active --json
  else
    echo "ERROR: none of ccusage / bunx / npx found on PATH." >&2
    echo "Install Node.js (or Bun), then: npm install -g ccusage" >&2
    exit 1
  fi
}

out="$(run)"
echo "$out"

# Pretty hint if jq is available
if command -v jq >/dev/null 2>&1; then
  echo "----" >&2
  echo "$out" | jq -r '.blocks[0] | "active window ends: \(.endTime)  tokens: \(.totalTokens // "n/a")  cost: \(.costUSD // "n/a")"' 2>/dev/null >&2 || true
fi
