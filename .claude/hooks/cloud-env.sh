#!/bin/bash
# Set up the skills' tools in Claude Code cloud sessions: point Archify and
# playwright-cli at the pre-installed Chromium, and install playwright-cli.
# Locally nothing is set or installed.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
[ -n "$CLAUDE_ENV_FILE" ] || exit 0

for chrome in /opt/pw-browsers/chromium-*/chrome-linux64/chrome; do
  if [ -x "$chrome" ]; then
    {
      [ -n "$ARCHIFY_CHROME" ] || echo "export ARCHIFY_CHROME=\"$chrome\""
      echo "export PLAYWRIGHT_MCP_BROWSER=chromium"
      echo "export PLAYWRIGHT_MCP_EXECUTABLE_PATH=\"$chrome\""
    } >> "$CLAUDE_ENV_FILE"
    break
  fi
done

command -v playwright-cli >/dev/null 2>&1 ||
  npm install -g --silent @playwright/cli@0.1.22 >/dev/null 2>&1

exit 0
